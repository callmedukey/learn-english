import {
  Html,
  Head,
  Container,
  Body,
  Section,
  Heading,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ResetPasswordEmailProps {
  token: string;
}

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  width: "580px",
};

const heading = {
  fontSize: "32px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#484848",
};

const paragraph = {
  fontSize: "18px",
  lineHeight: "1.4",
  color: "#484848",
};

export function ResetPasswordEmail(props: ResetPasswordEmailProps) {
  const { token } = props;

  return (
    <Html lang="en">
      <Head>
        <title>Reset Password | Reading Champ</title>
      </Head>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Heading style={heading} as="h1">
              Reset Password
            </Heading>
            <Text style={paragraph}>
              We received a request to reset your password for your Reading
              Champ account. Please use the following code to reset your
              password:
            </Text>
            <Text style={paragraph}>{token}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ResetPasswordEmail;
