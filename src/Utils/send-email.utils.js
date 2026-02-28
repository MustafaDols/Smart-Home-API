import nodemailer from "nodemailer";
import { EventEmitter } from "node:events";


export const sendEmail = async (
    {
        to,
        cc = 'dolsy674@gmail.com',
        subject,
        content,
        attachments = []
    }
) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        service: 'gmail',
        auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_PASSWORD
        },
        // tls: {
        //     rejectUnauthorized: false
        // }
    });


    const info = await transporter.sendMail({
        from: 'gpt2227263@gmail.com',
        to,
        cc,
        subject,
        // text,
        html: content,
        attachments
    })

    console.log('Info', info);

    return info
}


export const emitter = new EventEmitter()

emitter.on('sendEmail', (args) => {
    console.log('the sending Email event is started');
    sendEmail(args)
}) 