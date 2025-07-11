from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import smtplib


def send_email(to_email, subject, body):
    # SMTP server configuration (ensure these are stored securely)
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", 587))  # Default is 587 for TLS
    smtp_password = os.getenv("EMAIL_SECRET")
    from_email = os.getenv("SENDER_EMAIL")  # The email address you're sending from

    # Create the MIME message
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'html'))

    try:
        # Connect to the SMTP server and send the email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()  # Use TLS for encryption
            server.login(from_email, smtp_password)
            text = msg.as_string()
            server.sendmail(from_email, to_email, text)
        print(f"Email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email: {e}")

def generate_html_email_body(session_id,email, plan, plan_type, receipt, license_id=None):
    APP_DOMAIN = os.getenv("APP_DOMAIN",'http://178.16.143.20:9080')
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
            <h2 style="color: #4CAF50;">Thank you for your purchase, {email}!</h2>
            <p style="font-size: 16px;">
                We are pleased to inform you that your payment for the <strong>{plan}</strong> plan ({plan_type}) was successful.
            </p>
            <p style="font-size: 16px;">
                You can view your receipt below:
            </p>
            <p style="font-size: 16px;">
                <a href="{receipt}" style="color: #007bff; text-decoration: none;">View your receipt here</a>
            </p>
            
            {"<hr style='border: 1px solid #eee; margin: 20px 0;'/>" if plan_type == 'Online' else ''}
            
            {f"""
            <p style="font-size: 16px; color: #555;">
                As part of your <strong>Online</strong> plan, your unique license ID is: <strong>{license_id}</strong>.
            </p>
            """ if plan_type == 'Online' else ""}
            
            {f"""
            <p style="font-size: 16px; color: #555;">
                For your <strong>Offline</strong> software, please download the app and enjoy your experience!
            </p>
            <p style="font-size: 16px; color: #555;">
                <a href="{APP_DOMAIN}/checkout-result?success=true&session_id={session_id}&plan={plan}&planType={plan_type}" style="color: #007bff; text-decoration: none;">Download the app here</a>
            </p>
            """ if plan_type == 'Offline' else ""}
            
            <div style="border-top: 2px solid #eee; margin-top: 30px; padding-top: 20px;">
                <p style="font-size: 14px; color: #777;">If you have any questions or need assistance, feel free to contact our support team.</p>
                <p style="font-size: 14px; color: #777;">Thank you for choosing us! 😊</p>
            </div>
            <div style="text-align: center; margin-top: 40px; font-size: 14px; color: #888;">
                <p>&copy; ExtConvert - All rights reserved</p>
            </div>
        </div>
    </body>
    </html>
    """
    return html_body