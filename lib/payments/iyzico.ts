import type {
  PaymentProvider,
  CheckoutInput,
  CheckoutResult,
  VerifyResult,
} from "@/lib/payments/types";

const apiKey = process.env.IYZIPAY_API_KEY;
const secretKey = process.env.IYZIPAY_SECRET_KEY;
const baseUrl = process.env.IYZIPAY_BASE_URL || "https://sandbox-api.iyzipay.com";

function money(n: number): string {
  return n.toFixed(2);
}

async function getClient() {
  // iyzipay CommonJS paketi; yalnızca sunucuda, çağrı anında yüklenir.
  // @ts-expect-error iyzipay tip tanımı sağlamaz
  const mod = await import("iyzipay");
  const Iyzipay = mod.default || mod;
  return new Iyzipay({ apiKey, secretKey, uri: baseUrl });
}

export const iyzicoProvider: PaymentProvider = {
  name: "iyzico",

  isConfigured() {
    return Boolean(apiKey && secretKey);
  },

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (!this.isConfigured()) {
      return { ok: false, error: "Ödeme sağlayıcısı yapılandırılmamış." };
    }

    const { plan, user, callbackUrl, conversationId } = input;
    const priceStr = money(plan.price);

    const request = {
      locale: "tr",
      conversationId,
      price: priceStr,
      paidPrice: priceStr,
      currency: plan.currency,
      basketId: conversationId,
      paymentGroup: "SUBSCRIPTION",
      callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: user.id,
        name: user.username,
        surname: "Anonix",
        identityNumber: "11111111111",
        email: user.email,
        registrationAddress: "Anonix",
        city: "Istanbul",
        country: "Turkey",
        ip: "85.34.78.112",
      },
      billingAddress: {
        contactName: user.username,
        city: "Istanbul",
        country: "Turkey",
        address: "Anonix",
      },
      basketItems: [
        {
          id: plan.type,
          name: plan.name,
          category1: "Subscription",
          itemType: "VIRTUAL",
          price: priceStr,
        },
      ],
    };

    try {
      const client = await getClient();
      const result: any = await new Promise((resolve, reject) => {
        client.checkoutFormInitialize.create(request, (err: unknown, res: unknown) =>
          err ? reject(err) : resolve(res)
        );
      });

      if (result?.status !== "success") {
        return { ok: false, error: result?.errorMessage || "Ödeme başlatılamadı." };
      }
      return {
        ok: true,
        paymentPageUrl: result.paymentPageUrl,
        checkoutFormContent: result.checkoutFormContent,
        token: result.token,
      };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },

  async verify(token: string): Promise<VerifyResult> {
    if (!this.isConfigured()) {
      return { ok: false, success: false, error: "Ödeme sağlayıcısı yapılandırılmamış." };
    }
    try {
      const client = await getClient();
      const result: any = await new Promise((resolve, reject) => {
        client.checkoutForm.retrieve({ locale: "tr", token }, (err: unknown, res: unknown) =>
          err ? reject(err) : resolve(res)
        );
      });

      const success = result?.status === "success" && result?.paymentStatus === "SUCCESS";
      return { ok: true, success, paymentId: result?.paymentId, raw: result };
    } catch (e) {
      return { ok: false, success: false, error: (e as Error).message };
    }
  },
};
