import sgMail from "@sendgrid/mail";
import type { Rsvp } from "../shared/schema.js";

// Initialize SendGrid
let emailServiceInitialized = false;
let emailServiceAvailable = false;

function initializeEmailService(): boolean {
  if (!emailServiceInitialized) {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn(
        "SENDGRID_API_KEY environment variable is not set. Email notifications will be disabled.",
      );
      emailServiceAvailable = false;
    } else {
      try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        emailServiceAvailable = true;
        console.log("✅ SendGrid email service initialized successfully");
      } catch (error) {
        console.error("Failed to initialize SendGrid:", error);
        emailServiceAvailable = false;
      }
    }
    emailServiceInitialized = true;
  }
  return emailServiceAvailable;
}

async function sendEmail(params: {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<boolean> {
  if (!initializeEmailService()) {
    console.log("Email service not configured.");
    return false;
  }

  try {
    await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || "",
      html: params.html || "",
    });
    return true;
  } catch (error) {
    console.error("SendGrid email error:", error);
    return false;
  }
}

// Wedding couple's email addresses
const COUPLE_EMAILS = [
  "harutavetisyan0@gmail.com",
  "tatevhovsepyan22@gmail.com",
];

// Test function to verify email service is working
export async function testEmailService(): Promise<void> {
  if (!initializeEmailService()) {
    console.log("Email service not configured.");
    return;
  }

  // Test both email addresses individually
  const testEmails = [
    "harutavetisyan0@gmail.com",
    "tatevhovsepyan22@gmail.com",
  ];

  for (const email of testEmails) {
    try {
      console.log(`🧪 Testing email to: ${email}`);
      const success = await sendEmail({
        from: "noreply@wedding-platform.com",
        to: email,
        subject: "Test - Email Service Check",
        text: `This is a test email for ${email}. If you receive this email, the email service is working correctly.`,
        html: `<p>This is a test email for <strong>${email}</strong>. If you receive this email, the email service is working correctly.</p>`,
      });
      
      if (success) {
        console.log(`✅ Test email sent successfully to ${email}`);
      } else {
        console.log(`❌ Test email failed for ${email}`);
      }
    } catch (error) {
      console.error(`❌ Test email failed for ${email}:`, error);
    }
  }
}

export async function sendRsvpNotificationEmails(rsvp: Rsvp): Promise<boolean> {
  if (!initializeEmailService()) {
    console.log(
      "Email service not configured. Skipping RSVP notification emails.",
    );
    return false;
  }

  try {
    const attendanceText = rsvp.attendance === "attending" ? "Կգա" : "Չի գալիս";
    const guestInfo = rsvp.guestNames ? `\nՀյուրեր: ${rsvp.guestNames}` : "";

    const emailPromises = COUPLE_EMAILS.map((email) =>
      sendEmail({
        from: "noreply@wedding-platform.com",
        to: email,
        subject: `Նոր հաստատում հարսանիքի համար - ${rsvp.firstName} ${rsvp.lastName}`,
        text: `Նոր RSVP հաստատում\n\nԱնուն: ${rsvp.firstName} ${rsvp.lastName}\nԷլ․ հասցե: ${rsvp.email}\nՀյուրերի քանակ: ${rsvp.guestCount}\nՄասնակցություն: ${rsvp.attendance === "attending" ? "Կգա" : "Չի գալիս"}${rsvp.guestNames ? `\nՀյուրեր: ${rsvp.guestNames}` : ""}\n\nՀաստատվել է: ${rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleString("hy-AM") : new Date().toLocaleString("hy-AM")}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: white;">
            <h2 style="color: #333; text-align: center; font-weight: normal;">Նոր հաստատում ձեր հարսանիքի համար</h2>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
              <h3 style="color: #333; margin-bottom: 15px; font-weight: normal;">Հյուրի տվյալներ</h3>
              <p style="margin: 8px 0;"><strong>Անուն:</strong> ${rsvp.firstName} ${rsvp.lastName}</p>
              <p style="margin: 8px 0;"><strong>Էլ․ հասցե:</strong> ${rsvp.email}</p>
              <p style="margin: 8px 0;"><strong>Հյուրերի քանակ:</strong> ${rsvp.guestCount}</p>
              <p style="margin: 8px 0;"><strong>Մասնակցություն:</strong> ${attendanceText}</p>
              ${guestInfo}
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 14px; margin: 0;">Հաստատվել է: ${rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleString("hy-AM") : new Date().toLocaleString("hy-AM")}</p>
            </div>
          </div>
        `,
      }),
    );

    const results = await Promise.allSettled(emailPromises);

    // Detailed logging for each email attempt
    results.forEach((result, index) => {
      const email = COUPLE_EMAILS[index];
      if (result.status === "fulfilled" && result.value) {
        console.log(`✅ Email sent successfully to: ${email}`);
      } else {
        console.error(`❌ Email failed to: ${email}`, result.status === "rejected" ? result.reason : "Unknown error");
      }
    });

    const successCount = results.filter(
      (result) => result.status === "fulfilled" && result.value,
    ).length;
    console.log(
      `RSVP notification emails sent: ${successCount}/${COUPLE_EMAILS.length}`,
    );
    return successCount > 0;
  } catch (error) {
    console.error("Failed to send RSVP notification emails:", error);
    return false;
  }
}

export async function sendRsvpConfirmationEmail(rsvp: Rsvp): Promise<boolean> {
  if (!initializeEmailService()) {
    console.log(
      "Email service not configured. Skipping RSVP confirmation email.",
    );
    return false;
  }

  try {
    const attendanceText =
      rsvp.attendance === "attending"
        ? "Շատ ուրախ ենք, որ կգաք մեր հարսանիքին! 💕"
        : "Ցավոք, որ չեք կարողանա գալ: Ցանկանում ենք ձեզ բարելավություն: 💙";

    const success = await sendEmail({
      from: "noreply@wedding-platform.com",
      to: rsvp.email || "",
      subject: "Ձեր հաստատումը ստացվել է - Հարսանիք 10 Հոկտեմբեր 2025",
      text: `Սիրելի ${rsvp.firstName},\n\nՇնորհակալություն ձեր հաստատման համար:\n\n${attendanceText}\n\n${rsvp.attendance === "attending" ? "Ծիսակարգություն - Սուրբ Գրիգոր Լուսավորիչ Եկեղեցի, Ժամը 16:00\nՀանդես - BAYAZET HALL, Ժամը 19:00\n\nՄենք շատ ենք սիրում ձեզ և սպասում ենք այս հատուկ օրը ձեզ հետ կիսելուն:" : ""}\n\nՀարցերի դեպքում կապվեք մեզ հետ:\nharutavetisyan0@gmail.com | tatevhovsepyan22@gmail.com\n\nՀարգանքով,\nՀարութ և Տաթև`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #E4A5B8; font-style: italic;">Հարութ & Տաթև</h1>
            <p style="color: #666; font-size: 18px;">10 Հոկտեմբեր 2025</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 25px; border-radius: 15px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 15px;">Շնորհակալություն ${rsvp.firstName}ը!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #555;">${attendanceText}</p>
            
            ${
              rsvp.attendance === "attending"
                ? `
              <div style="margin: 20px 0; padding: 15px; background-color: white; border-radius: 10px;">
                <h3 style="color: #E4A5B8; margin-bottom: 10px;">📍 Ծիսակարգություն</h3>
                <p><strong>Սուրբ Գրիգոր Լուսավորիչ Եկեղեցի</strong><br/>
                Ժամը 16:00</p>
                
                <h3 style="color: #E4A5B8; margin: 15px 0 10px 0;">🍾 Հանդես</h3>
                <p><strong>BAYAZET HALL</strong><br/>
                Ժամը 19:00</p>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Մենք շատ ենք սիրում ձեզ և սպասում ենք այս հատուկ օրը ձեզ հետ կիսելուն: 💐
              </p>
            `
                : ""
            }
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>Հարցերի դեպքում կապվեք մեզ հետ:</p>
            <p>harutavetisyan0@gmail.com | tatevhovsepyan22@gmail.com</p>
          </div>
        </div>
      `,
    });

    if (success) {
      console.log(`RSVP confirmation email sent to: ${rsvp.email}`);
    }
    return success;
  } catch (error) {
    console.error("Failed to send RSVP confirmation email:", error);
    return false;
  }
}

// Template-scoped email functions
export async function sendTemplateRsvpNotificationEmails(rsvp: Rsvp, template: any): Promise<boolean> {
  if (!initializeEmailService()) {
    console.log("Email service not configured. Skipping template RSVP notification emails.");
    return false;
  }

  try {
    const config = template.config as any;
    const couple = config.couple || {};
    const wedding = config.wedding || {};
    const email = config.email || {};
    
    // Priority order: template ownerEmail > config recipients > fallback couple emails
    let recipientEmails = [];
    if (template.ownerEmail) {
      recipientEmails = [template.ownerEmail];
      console.log(`📧 Using template owner email: ${template.ownerEmail}`);
    } else if (email.recipients && email.recipients.length > 0) {
      recipientEmails = email.recipients;
      console.log(`📧 Using config recipient emails: ${email.recipients.join(', ')}`);
    } else {
      recipientEmails = [
        "harutavetisyan0@gmail.com",
        "tatevhovsepyan22@gmail.com"
      ];
      console.log(`📧 Using fallback couple emails`);
    }
    
    const coupleNames = couple.combinedNames || `${couple.groomName || "Groom"} & ${couple.brideName || "Bride"}`;
    const weddingDate = wedding.displayDate || wedding.date || "Wedding Day";
    
    const attendanceText = rsvp.attendance === "attending" ? "Կգա" : "Չի գալիս";
    const guestInfo = rsvp.guestNames ? `\nՀյուրեր: ${rsvp.guestNames}` : "";

    const emailPromises = recipientEmails.map((emailAddr: string) =>
      sendEmail({
        from: "noreply@wedding-platform.com",
        to: emailAddr,
        subject: `Նոր հաստատում հարսանիքի համար - ${rsvp.firstName} ${rsvp.lastName}`,
        text: `Նոր RSVP հաստատում\n\nԱնուն: ${rsvp.firstName} ${rsvp.lastName}\nԷլ․ հասցե: ${rsvp.email}\nՀյուրերի քանակ: ${rsvp.guestCount}\nՄասնակցություն: ${attendanceText}${guestInfo}\n\nՀաստատվել է: ${rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleString("hy-AM") : new Date().toLocaleString("hy-AM")}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: white;">
            <h2 style="color: #333; text-align: center; font-weight: normal;">Նոր հաստատում ${coupleNames} հարսանիքի համար</h2>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
              <h3 style="color: #333; margin-bottom: 15px; font-weight: normal;">Հյուրի տվյալներ</h3>
              <p style="margin: 8px 0;"><strong>Անուն:</strong> ${rsvp.firstName} ${rsvp.lastName}</p>
              <p style="margin: 8px 0;"><strong>Էլ․ հասցե:</strong> ${rsvp.email}</p>
              <p style="margin: 8px 0;"><strong>Հյուրերի քանակ:</strong> ${rsvp.guestCount}</p>
              <p style="margin: 8px 0;"><strong>Մասնակցություն:</strong> ${attendanceText}</p>
              ${guestInfo}
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 14px; margin: 0;">Հաստատվել է: ${rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleString("hy-AM") : new Date().toLocaleString("hy-AM")}</p>
              <p style="color: #666; font-size: 12px; margin-top: 10px;">Տեմփլեյթ: ${template.name || template.templateKey}</p>
            </div>
          </div>
        `,
      }),
    );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(result => result.status === "fulfilled").length;
    
    console.log(`Template RSVP notification emails sent: ${successCount}/${recipientEmails.length} for template ${template.id}`);
    return successCount > 0;
  } catch (error) {
    console.error("Failed to send template RSVP notification emails:", error);
    return false;
  }
}

export async function sendTemplateRsvpConfirmationEmail(rsvp: Rsvp, template: any): Promise<boolean> {
  if (!initializeEmailService()) {
    console.log("Email service not configured. Skipping template RSVP confirmation email.");
    return false;
  }

  try {
    const config = template.config as any;
    const couple = config.couple || {};
    const wedding = config.wedding || {};
    const locations = config.locations || [];
    
    const coupleNames = couple.combinedNames || `${couple.groomName || "Groom"} & ${couple.brideName || "Bride"}`;
    const weddingDate = wedding.displayDate || wedding.date || "Wedding Day";
    
    const attendanceText = rsvp.attendance === "attending"
      ? "Շատ ուրախ ենք, որ կգաք մեր հարսանիքին! 💕"
      : "Ցավոք, որ չեք կարողանա գալ: Ցանկանում ենք ձեզ բարելավություն: 💙";

    // Build location information from template config
    let locationInfo = "";
    if (rsvp.attendance === "attending" && locations.length > 0) {
      locationInfo = locations.map((loc: any, index: number) => {
        const emoji = index === 0 ? "📍" : "🍾";
        return `
          <h3 style="color: #E4A5B8; margin-bottom: 10px;">${emoji} ${loc.title || `Location ${index + 1}`}</h3>
          <p><strong>${loc.name || "Venue"}</strong><br/>
          ${loc.time ? `Ժամը ${loc.time}` : ""}${loc.address ? `<br/>${loc.address}` : ""}</p>
        `;
      }).join("");
    }

    const success = await sendEmail({
      from: "noreply@wedding-platform.com",
      to: rsvp.email || "",
      subject: `Ձեր հաստատումը ստացվել է - ${coupleNames} - ${weddingDate}`,
      text: `Սիրելի ${rsvp.firstName},\n\nՇնորհակալություն ձեր հաստատման համար:\n\n${attendanceText}\n\n${rsvp.attendance === "attending" && locations.length > 0 ? locations.map((loc: any) => `${loc.title || "Venue"}: ${loc.name || "TBD"}${loc.time ? ` - ${loc.time}` : ""}`).join("\n") : ""}\n\nՀարգանքով,\n${coupleNames}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #E4A5B8; font-style: italic;">${coupleNames}</h1>
            <p style="color: #666; font-size: 18px;">${weddingDate}</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 25px; border-radius: 15px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 15px;">Շնորհակալություն ${rsvp.firstName}ը!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #555;">${attendanceText}</p>
            
            ${rsvp.attendance === "attending" && locationInfo ? `
              <div style="margin: 20px 0; padding: 15px; background-color: white; border-radius: 10px;">
                ${locationInfo}
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Մենք սպասում ենք այս հատուկ օրը ձեզ հետ կիսելուն: 💐
              </p>
            ` : ""}
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>Հարգանքով, ${coupleNames}</p>
          </div>
        </div>
      `,
    });

    if (success) {
      console.log(`Template RSVP confirmation email sent to: ${rsvp.email} for template ${template.id}`);
    }
    return success;
  } catch (error) {
    console.error("Failed to send template RSVP confirmation email:", error);
    return false;
  }
}
