import nodemailer from 'nodemailer';

// create transporter
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async ({to, subject, body}) => {
    const response = await transporter.sendMail({
        from: process.env.SENDER_EMAIL, // sender address
        to, // list of receivers
        subject, // Subject line
        html: body, // plain text body
    });
    return response;
}

export default sendEmail;