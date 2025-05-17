import Image from "next/image";
import LoginForm from "@/app/(auth)/login/components/login-form";

export default function Page() {
  return (
    <div className="page-container">
      <header className="page-header">
        <Image 
          src="/logo/logo-small.png" 
          alt="Logo" 
          width={60} 
          height={80}
          priority
        />
      </header>

      <main className="flex flex-col lg:flex-row min-h-[calc(100vh-7rem)]">
        <section className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-8 max-w-full">
            <Image 
              src="/logo/logo-big.png" 
              alt="Reading Champ Logo" 
              width={258} 
              height={228}
              className="w-[180px] sm:w-[200px] lg:w-[258px] h-auto"
              priority
            />
            <div className="text-center lg:text-left max-w-full px-4">
              <h1 className="text-[#6B1D1D] text-[32px] sm:text-[40px] lg:text-[64px] font-bold leading-tight lg:leading-[64px] break-words sm:whitespace-nowrap">
                READING CHAMP
              </h1>
              <p className="text-[#6B1D1D] text-[20px] sm:text-[24px] lg:text-[32px] mt-[15px] font-bold leading-[100%]">
                Come and Join<br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                the Champions of Reading!
              </p>
            </div>
          </div>
        </section>

        <section className="flex-1 flex items-center justify-center p-4 lg:p-8 pb-[50px]">
          <LoginForm />
        </section>
      </main>
    </div>
  );
}