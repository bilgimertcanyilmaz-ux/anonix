"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { AuthorBadge } from "@/components/confession/AuthorBadge";
import { GolgeImage } from "@/components/golge/GolgeImage";
import { GolgeLikeButton } from "@/components/golge/GolgeLikeButton";
import { MessageButton } from "@/components/messages/MessageButton";
import { FollowButton } from "@/components/profile/FollowButton";
import { BlockButton } from "@/components/profile/BlockButton";
import { ReportButton } from "@/components/moderation/ReportButton";
import { ShareButton } from "@/components/viral/ShareButton";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { moodEmoji } from "@/lib/moods";
import { timeAgo } from "@/lib/format";
import { moderateText, MODERATION_BLOCK_MESSAGE } from "@/lib/moderation";
import type { GolgePost, GolgeComment } from "@/types";

const MIN = 2;
const MAX = 300;

export default function GolgeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();

  const [post, setPost] = useState<GolgePost | null>(null);
  const [comments, setComments] = useState<GolgeComment[]>([]);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: p, error } = await supabase
      .from("golge_posts")
      .select("*, profiles(username, gender, is_anonymous, avatar_url)")
      .eq("id", id)
      .maybeSingle();

    if (error || !p) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setPost(p as GolgePost);

    const { data: cmts } = await supabase
      .from("golge_comments")
      .select("*, profiles(username, gender, is_anonymous, avatar_url)")
      .eq("golge_post_id", id)
      .order("created_at", { ascending: true });
    setComments((cmts as GolgeComment[]) ?? []);

    if (user) {
      const { data: likeRow } = await supabase
        .from("golge_likes")
        .select("id")
        .eq("golge_post_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      setLiked(!!likeRow);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleComment(e: FormEvent) {
    e.preventDefault();
    setCommentError(null);

    if (!user) {
      toastError("Yorum yapmak için giriş yapmalısın.");
      router.push("/login");
      return;
    }
    if (profile?.is_banned) {
      toastError("Hesabınız topluluk kuralları nedeniyle kısıtlanmıştır.");
      return;
    }
    const text = commentText.trim();
    if (text.length < MIN) {
      setCommentError(`Yorum en az ${MIN} karakter olmalı.`);
      return;
    }
    if (text.length > MAX) {
      setCommentError(`Yorum en fazla ${MAX} karakter olabilir.`);
      return;
    }
    if (!moderateText(text).allowed) {
      setCommentError(MODERATION_BLOCK_MESSAGE);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("golge_comments").insert({
      golge_post_id: id,
      user_id: user.id,
      content: text,
    });
    setSubmitting(false);

    if (error) {
      setCommentError("Yorum eklenemedi. Lütfen tekrar dene.");
      return;
    }
    setCommentText("");
    success("Yorumun eklendi 💬");
    await load();
  }

  if (loading) {
    return (
      <Container>
        <div className="space-y-4 py-4">
          <div className="card h-80 animate-pulse" />
          <div className="card h-24 animate-pulse" />
        </div>
      </Container>
    );
  }

  if (notFound || !post) {
    return (
      <Container>
        <div className="card my-8 p-8 text-center">
          <p className="text-sm text-slate-400">Bu Gölge bulunamadı.</p>
          <div className="mt-4">
            <Button variant="ghost" onClick={() => router.push("/golge")}>
              Gölge'ye dön
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-5 py-4">
        {/* Tam görsel + overlay */}
        <GolgeImage
          imageUrl={post.image_url}
          overlayText={post.overlay_text}
          overlay={post.overlay_style}
          contain
        />

        {/* Bilgi kartı */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <AuthorBadge
              anonymous={post.is_anonymous}
              author={post.profiles}
              subtitle={timeAgo(post.created_at)}
            />
            <div className="flex shrink-0 items-center gap-2">
              {!post.is_anonymous && (
                <>
                  <FollowButton targetUserId={post.user_id} size="sm" />
                  <BlockButton targetUserId={post.user_id} size="sm" />
                </>
              )}
              {post.mood_tag && (
                <span className="chip">
                  <span>{moodEmoji(post.mood_tag)}</span>
                  {post.mood_tag}
                </span>
              )}
            </div>
          </div>

          {post.caption && (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-200">
              {post.caption}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/5 pt-4">
            <div className="flex items-center gap-5">
              <GolgeLikeButton
                postId={post.id}
                initialLiked={liked}
                initialCount={post.like_count}
              />
              <span className="text-sm text-slate-400">{post.comment_count} yorum</span>
            </div>
            <MessageButton confessionId={null} authorId={post.user_id} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <ShareButton type="golge" id={post.id} text={post.overlay_text || post.caption || "Gölge"} mood={post.mood_tag} />
            <ReportButton entityType="golge" entityId={post.id} reportedUserId={post.user_id} />
          </div>
        </div>

        {/* Yorum ekleme */}
        <form onSubmit={handleComment} className="card p-4">
          {commentError && (
            <div className="mb-3">
              <Alert tone="error">{commentError}</Alert>
            </div>
          )}
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={MAX}
            rows={3}
            placeholder={user ? "Yorumunu yaz..." : "Yorum yapmak için giriş yap"}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-brand-500/60"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {commentText.trim().length}/{MAX}
            </span>
            <Button type="submit" disabled={submitting} className="!px-5 !py-2 text-xs">
              {submitting ? "Gönderiliyor..." : "Yorum yap"}
            </Button>
          </div>
        </form>

        {/* Yorumlar */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-300">Yorumlar ({comments.length})</h2>
          {comments.length === 0 ? (
            <p className="card p-5 text-center text-sm text-slate-500">
              Henüz yorum yok. İlk yorumu sen yap.
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <AuthorBadge
                    anonymous={true}
                    author={c.profiles}
                    subtitle={timeAgo(c.created_at)}
                    size="sm"
                  />
                  <ReportButton
                    entityType="golge_comment"
                    entityId={c.id}
                    reportedUserId={c.user_id}
                    compact
                  />
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                  {c.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </Container>
  );
}
