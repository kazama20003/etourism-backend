import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

interface PaymentConfirmationParams {
  to: string;
  customerName: string;
  orderId: string;
  confirmationCode: string;
  total: number;
  currency: string;

  items: {
    name: string;
    quantity: number;
    date: string; // fecha de uso/hora/tour
    unitPrice: number;
    totalPrice: number;
  }[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly http: HttpService) {}

  // ============================================================
  // 1. USUARIO LOGUEADO
  // ============================================================
  async sendPaymentConfirmation(
    params: PaymentConfirmationParams,
  ): Promise<void> {
    try {
      await this.http.axiosRef.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            email: process.env.MAIL_FROM,
            name: 'Peru-Tourism',
          },
          to: [
            {
              email: params.to,
              name: params.customerName,
            },
          ],
          subject: '✅ Pago confirmado - Inca Travel Peru',
          htmlContent: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Pago confirmado</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:24px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">

          <!-- HEADER -->
          <tr>
            <td style="background:#0d9488;color:#ffffff;padding:20px 24px;">
              <h1 style="margin:0;font-size:22px;">Pago confirmado</h1>
              <p style="margin:4px 0 0;font-size:14px;">
                Gracias por elegir Peru-Tourism
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:24px;color:#333333;">
              <p style="margin-top:0;font-size:15px;">
                Hola <strong>${params.customerName}</strong>,
              </p>

              <p style="font-size:14px;line-height:1.6;">
                Tu pago ha sido <strong>procesado exitosamente</strong>.
                Tu cuenta ahora muestra la reserva en tu panel de usuario.
              </p>

              <!-- DETAILS -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">
                <tr>
                  <td style="padding:12px 16px;font-size:14px;">
                    <strong>Código de reserva:</strong><br />
                    ${params.confirmationCode}
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 16px;font-size:14px;">
                    <strong>Monto pagado:</strong><br />
                    ${params.total} ${params.currency}
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 16px;font-size:14px;">
                    <strong>ID de orden:</strong><br />
                    ${params.orderId}
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <p style="text-align:center;margin:28px 0;">
                <a
                  href="https://incatravelperu.com/users/profile"
                  style="background:#0d9488;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:14px;display:inline-block;"
                >
                  Ir a mi panel de usuario
                </a>
              </p>

              <p style="font-size:14px;line-height:1.6;">
                Nuestro equipo se pondrá en contacto contigo para coordinar tu experiencia.
              </p>

              <p style="margin-bottom:0;font-size:14px;">
                ¡Gracias por confiar en nosotros!<br />
                <strong>Peru-Tourism</strong>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f1f5f9;padding:16px 24px;font-size:12px;color:#64748b;text-align:center;">
              © ${new Date().getFullYear()} Peru-Tourism · Todos los derechos reservados<br />
              Mensaje automático, por favor no respondas.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`,
        },
        {
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      this.logger.error('Error enviando email de confirmación', error);
      throw error;
    }
  }

  // ============================================================
  // 2. USUARIO INVITADO (SIN CUENTA)
  // ============================================================
  async sendGuestPaymentConfirmation(
    params: PaymentConfirmationParams,
  ): Promise<void> {
    try {
      await this.http.axiosRef.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: {
            email: process.env.MAIL_FROM,
            name: 'Peru-Tourism',
          },
          to: [
            {
              email: params.to,
              name: params.customerName,
            },
          ],
          subject: '✅ Pago confirmado - Tu reserva en Inca Travel Peru',
          htmlContent: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Pago confirmado</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:24px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">

          <!-- HEADER -->
          <tr>
            <td style="background:#0d9488;color:#ffffff;padding:20px 24px;">
              <h1 style="margin:0;font-size:22px;">Pago confirmado</h1>
              <p style="margin:4px 0 0;font-size:14px;">
                Gracias por elegir Peru-Tourism
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:24px;color:#333333;">
              <p style="margin-top:0;font-size:15px;">
                Hola <strong>${params.customerName}</strong>,
              </p>

              <p style="font-size:14px;line-height:1.6;">
                Tu pago ha sido procesado. Como realizaste tu reserva sin crear una cuenta, puedes acceder a tu reserva usando este enlace:
              </p>

              <!-- CTA PARA INVITADO -->
              <p style="text-align:center;margin:28px 0;">
                <a
                  href="https://incatravelperu.com/reservas/${params.confirmationCode}"
                  style="background:#0d9488;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:14px;display:inline-block;"
                >
                  Ver mi reserva
                </a>
              </p>

              <p style="font-size:14px;line-height:1.6;">
                Guarda tu código de reserva:
              </p>

              <p style="text-align:center;font-size:20px;font-weight:bold;">
                ${params.confirmationCode}
              </p>

              <p style="margin-bottom:0;font-size:14px;">
                Nuestro equipo se pondrá en contacto contigo para coordinar los detalles.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f1f5f9;padding:16px 24px;font-size:12px;color:#64748b;text-align:center;">
              © ${new Date().getFullYear()} Peru-Tourism · Todos los derechos reservados
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body> 
</html>
`,
        },
        {
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      this.logger.error('Error enviando email de invitado', error);
      throw error;
    }
  }
}
