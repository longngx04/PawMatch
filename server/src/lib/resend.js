import {Resend} from "resend";
import {ENV} from "../lib/env.js";

export const resendClient = new Resend(ENV.RSEND_API_KEY);

export const sender ={
    email: ENV.EMAIL_FROM,
    name: ENV.EMAIL_FROM_NAME,
};