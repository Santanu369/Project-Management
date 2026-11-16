import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const send_mail = async(options) => {
    var mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            // Appears in header & footer of e-mails
            name: 'Task Manager',
            link: 'https://taskmanagerlink.com'
            // Optional product logo
            // logo: 'https://mailgen.js/img/logo.png'
        }
    });

    const mailTextual = mailGenerator.generatePlaintext(options.mailGenContent)
    const mailHTML = mailGenerator.generate(options.mailGenContent)
    
    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
        auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        },
    });

    const mail = {
        from: '"mail.taskmaneger@example.com', // sender address
        to: options.email, // list of recipients
        subject: options.subject, // subject line
        text: mailTextual, // plain text body
        html: mailHTML, // HTML body
      }
    

    // send mail
    try {
        const info = await transporter.sendMail(mail);
      
        console.log("Message sent: %s", info.messageId);
        // Preview URL is only available when using an Ethereal test account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      } catch (err) {
        console.error("Error while sending mail:", err);
      }
      
      

}
 
const emailVerificationMailGenContent = (username, verificationURL) => {
    return {
        body: {
            name: username,
            intro: 'Welcome to Mailgen! We\'re very excited to have you on board.',
            action: {
                instructions: 'To verify your email, please click here:',
                button: {
                    color: '#22BC66', // Optional action button color
                    text: 'Vefify your email',
                    link: verificationURL
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    };
}

const forgotPasswordMailGenContent = (username, verificationURL) => {
    return {
        body: {
            name: username,
            intro: 'Welcome to Mailgen! We\'re very excited to have you on board.',
            action: {
                instructions: 'To change your password, please click here:',
                button: {
                    color: '#22BC66', // Optional action button color
                    text: 'Change your password',
                    link: verificationURL
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    };
}

export {emailVerificationMailGenContent, forgotPasswordMailGenContent, send_mail}
