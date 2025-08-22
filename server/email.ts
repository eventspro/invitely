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

// Test function to verify email service is working
export async function testEmailService(): Promise<void> {
  if (!resend) {
    console.log('Email service not configured.');
    return;
  }
  
  try {
    const testResult = await resend.emails.send({
      from: 'Հարություն և Տատև <onboarding@resend.dev>',
      to: 'harutavetisyan0@gmail.com', // Test with first email
      subject: 'Թեստ - Էլ․ փոստի ծառայության ստուգում',
      text: 'Սա թեստային նամակ է։ Եթե ստանում եք այս նամակը, ապա էլ․ փոստի ծառայությունը ճիշտ է աշխատում։',
      html: '<p>Սա թեստային նամակ է։ Եթե ստանում եք այս նամակը, ապա էլ․ փոստի ծառայությունը ճիշտ է աշխատում։</p>'
    });
    console.log('🧪 Test email result:', testResult);
  } catch (error) {
    console.error('🧪 Test email failed:', error);
  }
}

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
        from: 'Հարուտ և Տատև <onboarding@resend.dev>',
        to: email,
        subject: `Նոր հաստատում հարսանիքի համար - ${rsvp.firstName} ${rsvp.lastName}`,
        text: `Նոր RSVP հաստատում\n\nԱնուն: ${rsvp.firstName} ${rsvp.lastName}\nԷլ․ հասցե: ${rsvp.email}\nՀյուրերի քանակ: ${rsvp.guestCount}\nՄասնակցություն: ${rsvp.attendance === 'attending' ? 'Կգա' : 'Չի գալիս'}${rsvp.guestNames ? `\nՀյուրեր: ${rsvp.guestNames}` : ''}\n\nՀաստատվել է: ${rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleString('hy-AM') : new Date().toLocaleString('hy-AM')}`,
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
              <p style="color: #666; font-size: 14px; margin: 0;">Հաստատվել է: ${rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleString('hy-AM') : new Date().toLocaleString('hy-AM')}</p>
            </div>
          </div>
        `
      })
    );

    const results = await Promise.allSettled(emailPromises);
    
    // Detailed logging for each email attempt
    results.forEach((result, index) => {
      const email = COUPLE_EMAILS[index];
      if (result.status === 'fulfilled') {
        console.log(`✅ Email sent successfully to: ${email}`, result.value);
      } else {
        console.error(`❌ Email failed to: ${email}`, result.reason);
      }
    });
    
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
      from: 'Հարություն և Տատև <onboarding@resend.dev>',
      to: rsvp.email,
      subject: 'Ձեր հաստատումը ստացվել է - Հարսանիք 10 Հոկտեմբեր 2025',
      text: `Սիրելի ${rsvp.firstName},\n\nՇնորհակալություն ձեր հաստատման համար:\n\n${attendanceText}\n\n${rsvp.attendance === 'attending' ? 'Ծիսակարգություն - Սուրբ Գրիգոր Լուսավորիչ Եկեղեցի, Ժամը 16:00\nՀանդես - BAYAZET HALL, Ժամը 19:00\n\nՄենք շատ ենք սիրում ձեզ և սպասում ենք այս հատուկ օրը ձեզ հետ կիսելուն:' : ''}\n\nՀարցերի դեպքում կապվեք մեզ հետ:\nharutavetisyan0@gmail.com | tatevhovsepyan22@gmail.com\n\nՀարգանքով,\nՀարություն և Տատև`,
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