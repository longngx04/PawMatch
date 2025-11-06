import {resendClient, sender} from "../lib/resend.js";
import {createWelcomeEmailTemplate} from "./emailTemplates.js";

export const sendWelcomeEmail = async(email, name , clientURL )=>{
    const {data, error} = await resendClient.emails.send({
        from: `${sender.name} <${sender.email}>`,
        to: email,
        subject: "Welcome to Pawmatch!",
        html: createWelcomeEmailTemplate(name, clientURL),
    })

    if (error) {
        console.error("Error sending welcome email:", error);
        
    }

    console.log("Welcome email sent successfully:", data);
};