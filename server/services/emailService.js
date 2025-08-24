const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(to, subject, html, text = '') {
    try {
      const mailOptions = {
        from: `"SkillSwap" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.CLIENT_BASE_URL}/verify-email?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Welcome to SkillSwap!</h1>
        <p>Hi ${user.firstName},</p>
        <p>Thank you for joining SkillSwap! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #6366f1; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6366f1; word-break: break-all;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 14px;">
          If you didn't create an account with SkillSwap, please ignore this email.
        </p>
      </div>
    `;

    const text = `Welcome to SkillSwap! Please verify your email address by visiting: ${verificationUrl}`;

    return this.sendEmail(user.email, 'Verify your SkillSwap account', html, text);
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.CLIENT_BASE_URL}/reset-password?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Reset Your Password</h1>
        <p>Hi ${user.firstName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #6366f1; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #6366f1; word-break: break-all;">${resetUrl}</p>
        <p><strong>This link will expire in 10 minutes.</strong></p>
        <hr style="margin: 30px 0; border: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 14px;">
          If you didn't request a password reset, please ignore this email.
        </p>
      </div>
    `;

    const text = `Reset your SkillSwap password by visiting: ${resetUrl}. This link expires in 10 minutes.`;

    return this.sendEmail(user.email, 'Reset your SkillSwap password', html, text);
  }

  async sendSessionConfirmationEmail(student, mentor, session) {
    const sessionUrl = `${process.env.CLIENT_BASE_URL}/my-swaps`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Session Confirmed!</h1>
        <p>Hi ${student.firstName},</p>
        <p>Your skill swap session has been confirmed!</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Session Details:</h3>
          <p><strong>Skill:</strong> ${session.skill.name}</p>
          <p><strong>Mentor:</strong> ${mentor.firstName} ${mentor.lastName}</p>
          <p><strong>Date & Time:</strong> ${new Date(session.scheduledAt).toLocaleString()}</p>
          <p><strong>Duration:</strong> ${session.duration} minutes</p>
          ${session.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${session.meetingLink}">${session.meetingLink}</a></p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${sessionUrl}" 
             style="background-color: #6366f1; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            View Session Details
          </a>
        </div>
        
        <p>We'll send you a reminder before your session starts.</p>
        <p>Happy learning!</p>
      </div>
    `;

    return this.sendEmail(student.email, 'Session Confirmed - SkillSwap', html);
  }

  async sendSwapRequestEmail(recipientEmail, { requesterName, skillOffered, skillWanted, message, actionUrl }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">New Skill Swap Request!</h1>
        <p>Hi there,</p>
        <p>You have received a new skill swap request from <strong>${requesterName}</strong>!</p>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <h3 style="margin: 0 0 10px 0; color: #0c4a6e;">What ${requesterName} wants to learn from you:</h3>
          <p style="font-size: 18px; color: #0369a1; font-weight: 600;">${skillWanted}</p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">What ${requesterName} can teach you:</h3>
          <p style="font-size: 16px; color: #374151; font-weight: 500;">${skillOffered}</p>
          <p><strong>Requester:</strong> ${requesterName}</p>
          ${message ? `<p><strong>Personal message:</strong></p><p style="font-style: italic; background: #fff; padding: 10px; border-left: 3px solid #6366f1;">"${message}"</p>` : ''}
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>🎯 Your turn!</strong> Choose which skill you'd like to learn from ${requesterName} - they've already chosen to learn ${skillWanted} from you!
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" 
             style="background-color: #6366f1; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Choose Skills & Respond
          </a>
        </div>
        
        <p>This is your chance to learn something new while sharing your knowledge! Don't keep them waiting too long.</p>
        <p>Happy skill swapping!</p>
        
        <hr style="margin: 30px 0; border: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 14px;">
          This email was sent because someone requested a skill swap with you on SkillSwap.
        </p>
      </div>
    `;

    const text = `New skill swap request from ${requesterName}. They want to learn ${skillWanted} from you. They can teach: ${skillOffered}. Choose which skill you'd like to learn from them. View and respond at: ${actionUrl}`;

    return this.sendEmail(recipientEmail, `${requesterName} wants to swap skills with you! - SkillSwap`, html, text);
  }

  async sendRescheduleRequestEmail(recipient, requester, session, newDate, reason) {
    const sessionUrl = `${process.env.CLIENT_BASE_URL}/my-swaps`;
    const oldDate = new Date(session.scheduledAt).toLocaleString();
    const newDateFormatted = new Date(newDate).toLocaleString();
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Session Reschedule Request</h1>
        <p>Hi ${recipient.firstName},</p>
        <p>${requester.firstName} ${requester.lastName} has requested to reschedule your upcoming session.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Session Details:</h3>
          <p><strong>Skill:</strong> ${session.skill.name}</p>
          <p><strong>Current Date & Time:</strong> ${oldDate}</p>
          <p style="color: #dc2626;"><strong>Requested New Date & Time:</strong> ${newDateFormatted}</p>
          <p><strong>Duration:</strong> ${session.duration} minutes</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${sessionUrl}" 
             style="background-color: #6366f1; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px;">
            View & Respond
          </a>
        </div>
        
        <p>Please log into SkillSwap to accept or decline this reschedule request.</p>
        <p style="color: #666; font-size: 14px;">If you don't respond within 48 hours, the original session time will remain unchanged.</p>
      </div>
    `;

    return this.sendEmail(recipient.email, 'Session Reschedule Request - SkillSwap', html);
  }

  async sendMeetingLinkEmail(recipient, sender, meetingLink, session) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Meeting Link Shared</h1>
        <p>Hi ${recipient.firstName},</p>
        <p>${sender.firstName} ${sender.lastName} has shared a meeting link for your upcoming session.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Session Details:</h3>
          <p><strong>Skill:</strong> ${session.skill.name}</p>
          <p><strong>Date & Time:</strong> ${new Date(session.scheduledAt).toLocaleString()}</p>
          <p><strong>Duration:</strong> ${session.duration} minutes</p>
          <p><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #6366f1;">${meetingLink}</a></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${meetingLink}" 
             style="background-color: #10b981; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px;">
            Join Meeting
          </a>
        </div>
        
        <p>Save this link and join the meeting at the scheduled time.</p>
        <p style="color: #666; font-size: 14px;">Please test your audio and video before the session begins.</p>
      </div>
    `;

    return this.sendEmail(recipient.email, 'Meeting Link for Your Session - SkillSwap', html);
  }

  async sendNotificationEmail(user, notification) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">SkillSwap Notification</h1>
        <p>Hi ${user.firstName},</p>
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_BASE_URL}/notifications" 
             style="background-color: #6366f1; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            View in SkillSwap
          </a>
        </div>
      </div>
    `;

    return this.sendEmail(user.email, `SkillSwap: ${notification.title}`, html);
  }
}

module.exports = new EmailService();
