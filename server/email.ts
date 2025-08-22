import { Resend } from 'resend';
import type { Rsvp } from '@shared/schema';

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY environment variable is not set. Email notifications will be disabled.");
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Wedding couple's email addresses
const COUPLE_EMAILS = [
  'harutavetisyan0@gmail.com',
  'tatevhovsepyan22@gmail.com'
];

export async function sendRsvpNotificationEmails(rsvp: Rsvp): Promise<boolean> {
  if (!resend) {
    console.log('Email service not configured. Skipping RSVP notification emails.');
    return false;
  }

  try {
    const attendanceText = rsvp.attendance === 'attending' ? 'Կգա' : 'Չի գալիս';
    const guestInfo = rsvp.guestNames ? `\nՀյուրեր: ${rsvp.guestNames}` : '';
    
    const emailPromises = COUPLE_EMAILS.map(email => 
      resend.emails.send({
        from: 'onboarding@resend.dev', // Using Resend's verified domain for testing
        to: email,
        subject: `🤵👰 Նոր RSVP հաստատում - ${rsvp.firstName} ${rsvp.lastName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #E4A5B8; text-align: center;">💐 Նոր Հարսանիքի Հաստատում 💐</h2>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">Հյուրի տվյալներ:</h3>
              <p><strong>Անուն:</strong> ${rsvp.firstName} ${rsvp.lastName}</p>
              <p><strong>Էլ․ հասցե:</strong> ${rsvp.email}</p>
              <p><strong>Հյուրերի քանակ:</strong> ${rsvp.guestCount}</p>
              <p><strong>Մասնակցություն:</strong> ${attendanceText}</p>
              ${guestInfo}
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 14px;">Հաստատվել է: ${rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleString('hy-AM') : new Date().toLocaleString('hy-AM')}</p>
              <p style="color: #E4A5B8; font-weight: bold;">💕 Շնորհակալություն Replit Agent-ից! 💕</p>
            </div>
          </div>
        `
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(result => result.status === 'fulfilled').length;
    
    console.log(`RSVP notification emails sent: ${successCount}/${COUPLE_EMAILS.length}`);
    return successCount > 0;
  } catch (error) {
    console.error('Failed to send RSVP notification emails:', error);
    return false;
  }
}

export async function sendRsvpConfirmationEmail(rsvp: Rsvp): Promise<boolean> {
  if (!resend) {
    console.log('Email service not configured. Skipping RSVP confirmation email.');
    return false;
  }

  try {
    const attendanceText = rsvp.attendance === 'attending' 
      ? 'Շատ ուրախ ենք, որ կգաք մեր հարսանիքին! 💕' 
      : 'Ցավոք, որ չեք կարողանա գալ: Ցանկանում ենք ձեզ բարելավություն: 💙';

    await resend.emails.send({
      from: 'onboarding@resend.dev', // Using Resend's verified domain for testing
      to: rsvp.email,
      subject: 'Հաստատում - Հարություն և Տատև 10 Հոկտեմբեր 2025',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #E4A5B8; font-style: italic;">Հարություն & Տատև</h1>
            <p style="color: #666; font-size: 18px;">10 Հոկտեմբեր 2025</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 25px; border-radius: 15px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 15px;">Շնորհակալություն ${rsvp.firstName}ը!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #555;">${attendanceText}</p>
            
            ${rsvp.attendance === 'attending' ? `
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
            ` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>Հարցերի դեպքում կապվեք մեզ հետ:</p>
            <p>harutavetisyan0@gmail.com | tatevhovsepyan22@gmail.com</p>
          </div>
        </div>
      `
    });

    console.log(`RSVP confirmation email sent to: ${rsvp.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send RSVP confirmation email:', error);
    return false;
  }
}