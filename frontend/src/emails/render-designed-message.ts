import { render } from "@react-email/render";
import { DesignedMessageEmail, type DesignedMessageProps } from "@/emails/designed-message";

export async function renderDesignedMessage(props: DesignedMessageProps): Promise<{ html: string; text: string }> {
  const email = DesignedMessageEmail(props);
  const html = await render(email);
  const text = await render(email, { plainText: true });
  return { html, text };
}
