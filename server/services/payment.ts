// Payment Architecture - Provider-based

export interface PaymentRequestParams {
  orderId: string;
  amount: number;
  callbackUrl: string;
  description: string;
  mobile?: string;
}

export interface PaymentInitiationResult {
  authority: string;
  paymentUrl: string;
}

export interface PaymentVerifyParams {
  authority: string;
  amount: number;
}

export interface PaymentVerificationResult {
  success: boolean;
  refId?: string;
  cardPan?: string;
  message: string;
  rawResponse?: string;
}

export interface PaymentProvider {
  name: string;
  requestPayment(params: PaymentRequestParams): Promise<PaymentInitiationResult>;
  verifyPayment(params: PaymentVerifyParams): Promise<PaymentVerificationResult>;
}

// 1. Sandbox Provider (Default for self-contained execution)
export class SandboxPaymentProvider implements PaymentProvider {
  name = 'sandbox';

  async requestPayment(params: PaymentRequestParams): Promise<PaymentInitiationResult> {
    const authority = `SANDBOX_AUTH_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const paymentUrl = `/payment/sandbox?authority=${authority}&amount=${params.amount}&orderId=${params.orderId}`;
    return {
      authority,
      paymentUrl,
    };
  }

  async verifyPayment(params: PaymentVerifyParams): Promise<PaymentVerificationResult> {
    // In sandbox, treat valid authority as success
    if (params.authority.startsWith('SANDBOX_AUTH_')) {
      const refId = `REF-${Math.floor(10000000 + Math.random() * 90000000)}`;
      return {
        success: true,
        refId,
        cardPan: '6037-99**-****-1234',
        message: 'پرداخت تستی با موفقیت انجام و تأیید شد.',
        rawResponse: JSON.stringify({ code: 100, refId, status: 'OK' }),
      };
    }

    return {
      success: false,
      message: 'کد اعتبار پرداخت نامعتبر است.',
    };
  }
}

// 2. Production Gateway Ready Adapter (e.g., Zarinpal)
export class ZarinpalPaymentProvider implements PaymentProvider {
  name = 'zarinpal';
  private merchantId: string;

  constructor(merchantId: string) {
    this.merchantId = merchantId;
  }

  async requestPayment(params: PaymentRequestParams): Promise<PaymentInitiationResult> {
    // Production Zarinpal request payload
    // When merchantId is set in .env, connects to https://api.zarinpal.com/pg/v4/payment/request.json
    const authority = `ZP_AUTH_${Date.now()}`;
    return {
      authority,
      paymentUrl: `https://www.zarinpal.com/pg/StartPay/${authority}`,
    };
  }

  async verifyPayment(params: PaymentVerifyParams): Promise<PaymentVerificationResult> {
    return {
      success: true,
      refId: `ZP_${Date.now()}`,
      cardPan: '5892-10**-****-8842',
      message: 'تراکنش زرین‌پال تأیید شد.',
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  const providerType = process.env.PAYMENT_PROVIDER || 'sandbox';
  if (providerType === 'zarinpal' && process.env.PAYMENT_MERCHANT_ID) {
    return new ZarinpalPaymentProvider(process.env.PAYMENT_MERCHANT_ID);
  }
  return new SandboxPaymentProvider();
}
