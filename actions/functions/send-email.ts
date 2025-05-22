"server only";

import { Resend } from "resend";
export const resendApi = new Resend(process.env.RESEND_API_KEY);

