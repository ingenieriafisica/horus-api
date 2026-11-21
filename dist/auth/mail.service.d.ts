export declare class MailService {
    private readonly logger;
    private transporter;
    constructor();
    sendOtp(to: string, code: string, expiresInMinutes?: number): Promise<void>;
    sendAlertEmail(to: string[], subject: string, title: string, message: string): Promise<void>;
}
