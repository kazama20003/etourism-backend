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

          <tr>
            <td style="background:#0d9488;color:#ffffff;padding:20px 24px;">
              <h1 style="margin:0;font-size:22px;">Pago confirmado</h1>
              <p style="margin:4px 0 0;font-size:14px;">Gracias por elegir Peru-Tourism</p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px;color:#333333;">
              <p style="margin-top:0;font-size:15px;">Hola <strong>${params.customerName}</strong>,</p>

              <p style="font-size:14px;line-height:1.6;">
                Tu pago ha sido procesado. Como realizaste tu reserva sin crear una cuenta, puedes acceder a tu reserva usando este enlace:
              </p>

              <p style="text-align:center;margin:28px 0;">
                <a href="https://incatravelperu.com/reservas/${params.confirmationCode}"
                   style="background:#0d9488;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:14px;display:inline-block;">
                  Ver mi reserva
                </a>
              </p>

              <p style="font-size:14px;line-height:1.6;">Guarda tu código de reserva:</p>

              <p style="text-align:center;font-size:20px;font-weight:bold;">
                ${params.confirmationCode}
              </p>

              <p style="margin-bottom:0;font-size:14px;">
                Nuestro equipo se pondrá en contacto contigo para coordinar los detalles.
              </p>
            </td>
          </tr>

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
      this.logger.error('Error enviando email de confirmación', error);
      throw error;
    }
  }

  // ============================================================
  // 2. USUARIO INVITADO (SIN CUENTA)
  // ============================================================
  // ============================================================
  // 2. USUARIO INVITADO (SIN CUENTA) — CON DETALLES DE ITEMS
  // ============================================================
  async sendGuestPaymentConfirmation(
    params: PaymentConfirmationParams,
  ): Promise<void> {
    try {
      // Construcción de filas HTML para cada item
      const itemsRows = params.items
        .map(
          (item) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;">${item.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:center;">${item.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:center;">${item.date}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;">${item.unitPrice} ${params.currency}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;">${item.totalPrice} ${params.currency}</td>
          </tr>
        `,
        )
        .join('');

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
          subject: '✅ Pago confirmado – Tu reserva en Inca Travel Peru',
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

        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">

          <!-- HEADER -->
          <tr>
            <td style="background:#0d9488;color:#ffffff;padding:20px 24px;">
              <h1 style="margin:0;font-size:22px;">Pago confirmado</h1>
              <p style="margin:4px 0 0;font-size:14px;">Gracias por elegir Peru-Tourism</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:24px;color:#333333;font-size:15px;">

              <p style="margin-top:0;">Hola <strong>${params.customerName}</strong>,</p>

              <p style="line-height:1.6;">
                Hemos recibido tu pago exitosamente.  
                Como realizaste tu reserva sin crear una cuenta, puedes ver tu reserva usando este enlace:
              </p>

              <p style="text-align:center;margin:28px 0;">
                <a href="https://incatravelperu.com/reservas/${params.confirmationCode}"
                   style="background:#0d9488;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:14px;display:inline-block;">
                  Ver mi reserva
                </a>
              </p>

              <!-- CÓDIGO DE RESERVA -->
              <p style="text-align:center;font-size:16px;margin-bottom:24px;">
                <strong>Código de reserva:</strong><br />
                <span style="font-size:22px;">${params.confirmationCode}</span>
              </p>

              <!-- DETALLES DE ITEMS -->
              <h3 style="font-size:16px;margin:0 0 12px 0;">Detalles de tu compra:</h3>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;">
                <thead>
                  <tr style="background:#e5e7eb;">
                    <th style="padding:10px;font-size:14px;text-align:left;">Producto</th>
                    <th style="padding:10px;font-size:14px;text-align:center;">Cantidad</th>
                    <th style="padding:10px;font-size:14px;text-align:center;">Fecha</th>
                    <th style="padding:10px;font-size:14px;text-align:right;">Precio</th>
                    <th style="padding:10px;font-size:14px;text-align:right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- TOTAL GENERAL -->
              <p style="text-align:right;font-size:18px;margin-top:18px;">
                <strong>Total pagado: ${params.total} ${params.currency}</strong>
              </p>

              <p style="line-height:1.6;margin-top:24px;">
                Nuestro equipo se pondrá en contacto contigo para coordinar los detalles de tu experiencia.
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
