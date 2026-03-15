Hello, 

We noticed this is your first app submission and want to congratulate you on joining the Apple Developer Program. We look forward to working together on your submissions.

When App Review identifies an issue with a submission, we’ll contact you with a message in App Store Connect with details about what we found and how to resolve the issue. Learn more about App Review and tips for a smooth review experience. 

See below for additional information about the issues that require your attention for this submission. If you have any questions, we are here to help. Reply to this message in App Store Connect and let us know.

Review Environment
Submission ID: 94cee826-6370-4d88-9e4e-ac404513f1a0
Review date: March 12, 2026
Review Device: iPad Air 11-inch (M3)
Version reviewed: 1.0

Guideline 5.1.2(i) - Legal - Privacy - Data Use and Sharing

Issue Description

The app privacy information provided in App Store Connect indicates the app collects data in order to track the user, including Email Address, User ID, and Purchase History. However, the app does not use App Tracking Transparency to request the user's permission before tracking their activity.

Apps need to receive the user’s permission through the AppTrackingTransparency framework before collecting data used to track them. This requirement protects the privacy of users.

Next Steps

Here are three ways to resolve this issue:

- If the app does not currently track, update the app privacy information in App Store Connect. You must have the Account Holder or Admin role to update app privacy information. If you are unable to change the privacy label, reply to this message in App Store Connect, and make sure your App Privacy Information in App Store Connect is up to date before submitting your next update for review.

- If this app does not track on the platform associated with this submission, but tracks on other platforms, notify App Review by replying to the rejection in App Store Connect. You should also reply if this app does not track on the platform associated with this submission but tracks on other Apple platforms this app is available on.

- If the app tracks users on all supported platforms, the app must use App Tracking Transparency to request permission before collecting data used to track. When resubmitting, indicate in the Review Notes where the permission request is located.

Note that if the app behaves differently in different countries or regions, you should provide a way for App Review to review these variations in the app submission. Additionally, these differences should be documented in the Review Notes section of App Store Connect.

Resources

- Tracking is linking data collected from the app with third-party data for advertising purposes, or sharing the collected data with a data broker. Learn more about tracking. 
- See Frequently Asked Questions about the requirements for apps that track users.
- Learn more about designing appropriate permission requests.
Guideline 3.1.2(c) - Business - Payments - Subscriptions
Issue Description

The submission did not include all the required information for apps offering auto-renewable subscriptions.

The following information needs to be included within the app:

- A functional link to the Terms of Use (EULA)
- A functional link to the privacy policy

You can use SubscriptionStoreView to easily include all of the required information in the app's purchase flow.

The following information needs to be included in the App Store metadata:

- A functional link to the Terms of Use (EULA). If you are using the standard Apple Terms of Use (EULA), include a link to the Terms of Use in the App Description. If you are using a custom EULA, add it in App Store Connect.

Next Steps

Update the app and App Store metadata to include the information specified above.

Resources

Apps offering auto-renewable subscriptions must include all of the following required information in the app itself:

- Title of auto-renewing subscription (this may be the same as the In-App Purchase product name)
- Length of subscription
- Price of subscription, and price per unit if appropriate
- Functional links to the privacy policy and Terms of Use (EULA)

The app metadata must also include functional links to the privacy policy in the Privacy Policy field in App Store Connect and the Terms of Use (EULA) in the App Description or EULA field in App Store Connect.

Review Schedule 2 of the Apple Developer Program License Agreement to learn more.
Guideline 5.1.1(v) - Data Collection and Storage
Issue Description

The app supports account creation but does not include an option to initiate account deletion that meets all the requirements. The process for initiating account deletion must provide a consistent, transparent experience for users by meeting all of the following requirements: 

- Allow users to complete account deletion without extra steps. Do not require them to create an additional account, register, or add a password to complete account deletion.
- Only offering to temporarily deactivate or disable an account is insufficient.
- If users need to visit a website to finish deleting their account, include a link directly to the website page where they can complete the process.
- The app may include confirmation steps to prevent users from accidentally deleting their account. However, only apps in highly-regulated industries may require users to use customer service resources, such as making a phone call or sending an email, to complete account deletion.

Next Steps

Update the app to include an account deletion option that fixes the following issues: 

- The app redirects the user to a website to complete account deletion, but does not link directly to the appropriate page to complete the process.

If you believe the current account deletion option meets all the requirements, either because the app operates in a highly-regulated industry or for some other reason, reply to App Review in App Store Connect and provide additional information or documentation. 

Resources

Review frequently asked questions and learn more about the account deletion requirements.
Guideline 2.3.2 - Performance - Accurate Metadata

Issue Description

We noticed that your promotional image to be displayed on the App Store does not sufficiently represent the associated promoted In-App Purchase and/or win back offer. Specifically, we found the following issue with your promotional image:

 – Your promotional image is the same as the app’s icon.

 – You submitted duplicate or identical promotional images for different promoted In-App Purchase products and/or win back offers. 

Next Steps

To resolve this issue, please revise your promotional image to ensure it is unique and accurately represents the associated promoted In-App Purchase and/or win back offer. 

Resources

- Learn how to view and edit In-App Purchase information in App Store Connect.
- Discover more best practices for promoting your In-App Purchases on the App Store.
Support
- Reply to this message in your preferred language if you need assistance. If you need additional support, use the Contact Us module.
- Consult with fellow developers and Apple engineers on the Apple Developer Forums.
- Provide feedback on this message and your review experience by completing a short survey.
