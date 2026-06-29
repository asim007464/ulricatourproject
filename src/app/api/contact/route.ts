import { NextResponse } from "next/server";
import { saveContactMessage } from "@/lib/contact-messages";
import { sendContactMessageNotification } from "@/lib/email";

type ContactPayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
};

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let payload: ContactPayload;

    if (contentType.includes("application/json")) {
      payload = (await request.json()) as ContactPayload;
    } else {
      const formData = await request.formData();
      payload = {
        first_name: formData.get("form_fields[name]")?.toString().trim(),
        last_name: formData.get("form_fields[field_1e45323]")?.toString().trim(),
        email: formData.get("form_fields[email]")?.toString().trim(),
        phone: formData.get("form_fields[field_bd8ab05]")?.toString().trim(),
        subject: formData.get("form_fields[field_c10f26c]")?.toString().trim(),
        message: formData.get("form_fields[message]")?.toString().trim(),
      };
    }

    const firstName = payload.first_name?.trim() || "";
    const lastName = payload.last_name?.trim() || "";
    const email = payload.email?.trim() || "";
    const phone = payload.phone?.trim() || "";
    const subject = payload.subject?.trim() || "";
    const message = payload.message?.trim() || "";

    if (!firstName) {
      return NextResponse.json(
        { success: false, message: "Please enter your first name." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Please enter your email address." },
        { status: 400 }
      );
    }

    const savedId = await saveContactMessage({
      first_name: firstName,
      last_name: lastName || null,
      email,
      phone: phone || null,
      subject: subject || null,
      message: message || null,
      status: "new",
    });

    if (!savedId) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not send your message right now. Please try again.",
        },
        { status: 500 }
      );
    }

    try {
      await sendContactMessageNotification({
        firstName,
        lastName,
        email,
        phone,
        subject,
        message,
      });
    } catch (emailError) {
      console.error("Contact form email failed:", emailError);
    }

    return NextResponse.json({
      success: true,
      message:
        "Thank you! Your message was sent successfully. We will get back to you within 24 hours.",
    });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Could not send your message.",
      },
      { status: 500 }
    );
  }
}
