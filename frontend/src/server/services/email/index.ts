export {
  EmailService,
  buildResendPayload,
  getResendFromEmail,
  isEmailConfigured,
  sendEmail,
  sendTemplate,
  type SendEmailInput,
  type SendEmailResult,
} from "./email-service";
export { handleEmailEvent } from "./events";
export {
  EMAIL_TEMPLATES,
  renderEmailTemplate,
  type EmailTemplateId,
  type EmailTemplateVars,
} from "./templates";
