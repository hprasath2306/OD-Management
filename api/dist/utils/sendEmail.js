import nodemailer from "nodemailer";
// Configure the email transporter
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
// Function to send verification email
export const sendVerificationEmail = async (user, otp) => {
    await transporter.sendMail({
        from: '"Your App" <no-reply@yourapp.com>',
        to: user.email,
        subject: "Verify Your Email",
        html: `<p>Your OTP is ${otp} to verify your email. will expire 8 mins</p>`,
    });
};
// Function to send reset password email
export const sendResetPasswordEmail = async (user, otp) => {
    await transporter.sendMail({
        from: '"Your App" <no-reply@yourapp.com>',
        to: user.email,
        subject: "Reset Your Password",
        html: `<p>Your OTP is ${otp} to reset your password. will expire 8 mins</p>`,
    });
};
export const sendEmail = async (options) => {
    const mailOptions = {
        from: process.env.SMPT_MAIL,
        to: options.to,
        subject: options.subject,
        html: options.message,
    };
    await transporter.sendMail(mailOptions);
};
