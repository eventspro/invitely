import type { Rsvp } from "../shared/schema.js";

// Initialize Brevo with dynamic import
let emailServiceInitialized = false;
let emailServiceAvailable = false;
let brevoClient: any = null;
let brevo: any = null;

async function initializeEmailService(): Promise<boolean> {
  if (!emailServiceInitialized) {
    if (!process.env.BREVO_API_KEY) {
      console.warn(
        "BREVO_API_KEY environment variable is not set. Email notifications will be disabled.",
      );
      emailServiceAvailable = false;
    } else {
      try {
        // Dynamic import for serverless compatibility
        if (!brevo) {
          brevo = await import('@getbrevo/brevo');
        }
        
        const apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
        brevoClient = apiInstance;
        emailServiceAvailable = true;
        console.log("✅ Brevo email service initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Brevo:", error);
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
  replyTo?: string;
  senderName?: string;
}): Promise<boolean> {
  if (!(await initializeEmailService()) || !brevoClient) {
    console.log("Email service not configured.");
    return false;
  }

  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { 
      email: params.from, 
      name: params.senderName || "Invitely" 
    };
    sendSmtpEmail.to = [{ email: params.to }];
    sendSmtpEmail.subject = params.subject;
    sendSmtpEmail.textContent = params.text || "";
    sendSmtpEmail.htmlContent = params.html || "";
    
    // Add reply-to if provided
    if (params.replyTo) {
      sendSmtpEmail.replyTo = { email: params.replyTo };
    }
    
    await brevoClient.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error("Brevo email error:", error);
    return false;
  }
}

// Wedding couple's email addresses
const COUPLE_EMAILS = [
  "harutavetisyan0@gmail.com",
  "tatevhovsepyan22@gmail.com",
];

// Test function to verify Brevo email service is working
export async function testEmailService(): Promise<void> {
  if (!(await initializeEmailService())) {
    console.log("Brevo email service not configured.");
    return;
  }

  // Test both email addresses individually
  const testEmails = [
    "harutavetisyan0@gmail.com",
    "tatevhovsepyan22@gmail.com",
  ];

  for (const email of testEmails) {
    try {
      console.log(`🧪 Testing Brevo email to: ${email}`);
      const success = await sendEmail({
        from: "noreply@4ever.am", // Use your verified domain
        to: email,
        subject: "Test - Brevo Email Service Check",
        text: `This is a test email for ${email}. If you receive this email, Brevo is working correctly.`,
        html: `<p>This is a test email for <strong>${email}</strong>. If you receive this email, <strong>Brevo</strong> is working correctly.</p>`,
      });
      
      if (success) {
        console.log(`✅ Brevo test email sent successfully to ${email}`);
      } else {
        console.log(`❌ Brevo test email failed for ${email}`);
      }
    } catch (error) {
      console.error(`❌ Brevo test email failed for ${email}:`, error);
    }
  }
}

export async function sendRsvpNotificationEmails(rsvp: Rsvp): Promise<boolean> {
  if (!(await initializeEmailService())) {
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
        from: "noreply@4ever.am", // Use your verified domain
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
  if (!(await initializeEmailService())) {
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
      from: "noreply@4ever.am", // Use your verified domain
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

// Template-scoped email functions with customizable templates
export async function sendTemplateRsvpNotificationEmails(rsvp: Rsvp, template: any): Promise<boolean> {
  if (!(await initializeEmailService())) {
    console.log("Email service not configured. Skipping template RSVP notification emails.");
    return false;
  }

  try {
    const config = template.config as any;
    const couple = config.couple || {};
    const wedding = config.wedding || {};
    const email = config.email || {};
    
    // Priority order: config ownerEmail > template ownerEmail > config recipients > fallback couple emails
    let recipientEmails = [];
    if (email.ownerEmail) {
      recipientEmails = [email.ownerEmail];
      console.log(`📧 Using config owner email: ${email.ownerEmail}`);
    } else if (template.ownerEmail) {
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
    
    // Get customizable email content
    const emailTemplates = email.templates?.notification || {};
    const emailTheme = email.theme || {};
    const primaryColor = emailTheme.primaryColor || "#E4A5B8";
    const secondaryColor = emailTheme.secondaryColor || "#666";
    const fontFamily = emailTheme.fontFamily || "Arial";
    const senderName = email.senderName || `${coupleNames} Wedding`;
    
    // Build subject with variable substitution
    let subject = emailTemplates.subject || "Նոր հաստատում հարսանիքի համար - {guestName}";
    subject = subject
      .replace("{guestName}", `${rsvp.firstName} ${rsvp.lastName}`)
      .replace("{coupleNames}", coupleNames)
      .replace("{weddingDate}", weddingDate);
    
    const headerMessage = emailTemplates.header || `Նոր հաստատում ${coupleNames} հարսանիքի համար`;
    const footerMessage = emailTemplates.footer || `Տեմփլեյթ: ${template.name || template.templateKey}`;
    
    const attendanceText = rsvp.attendance === "attending" ? "Կգա" : "Չի գալիս";
    const guestInfo = rsvp.guestNames ? `\nՀյուրեր: ${rsvp.guestNames}` : "";

    const emailPromises = recipientEmails.map((emailAddr: string) =>
      sendEmail({
        from: "noreply@4ever.am", // Use your verified domain
        to: emailAddr,
        subject: subject,
        senderName: senderName,
        replyTo: email.replyTo,
        text: `${headerMessage}\n\nԱնուն: ${rsvp.firstName} ${rsvp.lastName}\nԷլ․ հասցե: ${rsvp.email}\nՀյուրերի քանակ: ${rsvp.guestCount}\nՄասնակցություն: ${attendanceText}${guestInfo}\n\nՀաստատվել է: ${rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleString("hy-AM") : new Date().toLocaleString("hy-AM")}\n\n${footerMessage}`,
        html: `
          <div style="font-family: ${fontFamily}, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: white;">
            <h2 style="color: ${primaryColor}; text-align: center; font-weight: normal; margin-bottom: 20px;">${headerMessage}</h2>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
              <h3 style="color: ${secondaryColor}; margin-bottom: 15px; font-weight: normal;">Հյուրի տվյալներ</h3>
              <p style="margin: 8px 0; color: ${secondaryColor};"><strong>Անուն:</strong> ${rsvp.firstName} ${rsvp.lastName}</p>
              <p style="margin: 8px 0; color: ${secondaryColor};"><strong>Էլ․ հասցե:</strong> ${rsvp.email}</p>
              <p style="margin: 8px 0; color: ${secondaryColor};"><strong>Հյուրերի քանակ:</strong> ${rsvp.guestCount}</p>
              <p style="margin: 8px 0; color: ${secondaryColor};"><strong>Մասնակցություն:</strong> ${attendanceText}</p>
              ${guestInfo ? `<p style="margin: 8px 0; color: ${secondaryColor};"><strong>Հյուրերի անունները:</strong> ${rsvp.guestNames}</p>` : ""}
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 14px; margin: 0;">Հաստատվել է: ${rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleString("hy-AM") : new Date().toLocaleString("hy-AM")}</p>
              ${footerMessage ? `<p style="color: #666; font-size: 12px; margin-top: 10px;">${footerMessage}</p>` : ""}
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
  if (!(await initializeEmailService())) {
    console.log("Email service not configured. Skipping template RSVP confirmation email.");
    return false;
  }

  try {
    const config = template.config as any;
    const couple = config.couple || {};
    const wedding = config.wedding || {};
    const locations = config.locations || [];
    const email = config.email || {};
    
    const coupleNames = couple.combinedNames || `${couple.groomName || "Groom"} & ${couple.brideName || "Bride"}`;
    const weddingDate = wedding.displayDate || wedding.date || "Wedding Day";
    
    // Get customizable email content
    const emailTemplates = email.templates?.confirmation || {};
    const emailTheme = email.theme || {};
    const primaryColor = emailTheme.primaryColor || "#E4A5B8";
    const secondaryColor = emailTheme.secondaryColor || "#666";
    const fontFamily = emailTheme.fontFamily || "Arial";
    const senderName = email.senderName || `${coupleNames} Wedding`;
    const replyTo = email.replyTo;
    
    // Build subject with variable substitution
    let subject = emailTemplates.subject || "Ձեր հաստատումը ստացվել է - {coupleNames} - {weddingDate}";
    subject = subject
      .replace("{guestName}", rsvp.firstName)
      .replace("{coupleNames}", coupleNames)
      .replace("{weddingDate}", weddingDate);
    
    // Build greeting message
    let greeting = emailTemplates.greeting || "Սիրելի {guestName}, Շնորհակալություն ձեր հաստատման համար:";
    greeting = greeting.replace("{guestName}", rsvp.firstName);
    
    // Get attendance-specific messages
    const attendingMessage = rsvp.attendance === "attending" 
      ? (emailTemplates.attendingMessage || "Շատ ուրախ ենք, որ կգաք մեր հարսանիքին! 💕")
      : (emailTemplates.notAttendingMessage || "Ցավոք, որ չեք կարողանա գալ: Ցանկանում ենք ձեզ բարելավություն: 💙");
    
    const footerMessage = emailTemplates.footer || "Հարգանքով, {coupleNames}";
    const finalFooter = footerMessage.replace("{coupleNames}", coupleNames);

    // Build location information from template config
    let locationInfo = "";
    if (rsvp.attendance === "attending" && locations.venues && locations.venues.length > 0) {
      locationInfo = locations.venues.map((loc: any, index: number) => {
        const emoji = index === 0 ? "📍" : "🍾";
        return `
          <h3 style="color: ${primaryColor}; margin-bottom: 10px;">${emoji} ${loc.title || `Location ${index + 1}`}</h3>
          <p><strong>${loc.name || "Venue"}</strong><br/>
          ${loc.time ? `Ժամը ${loc.time}` : ""}${loc.address ? `<br/>${loc.address}` : ""}</p>
        `;
      }).join("");
    }

    // Create email with optional Reply-To
    const emailData: any = {
      from: "noreply@4ever.am", // Use your verified domain
      to: rsvp.email || "",
      subject: subject,
      senderName: senderName,
      text: `${greeting}\n\n${attendingMessage}\n\n${rsvp.attendance === "attending" && locations.venues && locations.venues.length > 0 ? locations.venues.map((loc: any) => `${loc.title || "Venue"}: ${loc.name || "TBD"}${loc.time ? ` - ${loc.time}` : ""}`).join("\n") : ""}\n\n${finalFooter}`,
      html: `
        <div style="font-family: ${fontFamily}, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${primaryColor}; font-style: italic;">${coupleNames}</h1>
            <p style="color: ${secondaryColor}; font-size: 18px;">${weddingDate}</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 25px; border-radius: 15px; text-align: center;">
            <h2 style="color: ${secondaryColor}; margin-bottom: 15px;">${greeting}</h2>
            <p style="font-size: 16px; line-height: 1.6; color: ${secondaryColor};">${attendingMessage}</p>
            
            ${rsvp.attendance === "attending" && locationInfo ? `
              <div style="margin: 20px 0; padding: 15px; background-color: white; border-radius: 10px;">
                ${locationInfo}
              </div>
              
              <p style="color: ${secondaryColor}; font-size: 14px; margin-top: 20px;">
                Մենք սպասում ենք այս հատուկ օրը ձեզ հետ կիսելուն: 💐
              </p>
            ` : ""}
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>${finalFooter}</p>
          </div>
        </div>
      `,
    };

    // Add reply-to if configured
    if (replyTo) {
      emailData.replyTo = replyTo;
    }

    const success = await sendEmail(emailData);

    if (success) {
      console.log(`Template RSVP confirmation email sent to: ${rsvp.email} for template ${template.id}`);
    }
    return success;
  } catch (error) {
    console.error("Failed to send template RSVP confirmation email:", error);
    return false;
  }
}
