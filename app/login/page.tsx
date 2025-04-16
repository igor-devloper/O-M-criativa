import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import { LogInIcon } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Login - Painel Criativa",
  description: "Faça login para acessar o Painel Criativa.",
};

const LoginPage = async () => {
  const { userId } = await auth();
  if (userId) {
    redirect("/");
  }

  return (
    <div className="flex h-full flex-col md:grid md:grid-cols-2">
      {/* Left Side */}
      <div className="relative flex h-full flex-col justify-center px-8 lg:px-16">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 via-gray-50 to-gray-50 md:hidden" />
        <div className="relative z-10 mx-auto w-full max-w-[500px] space-y-6">
          <div className="space-y-1.5">
            <div className="inline-block p-4">
              <Image
                src="/logo.png"
                width={100}
                height={55}
                alt="Criativa Energia"
                className="h-auto w-auto"
                priority
              />
            </div>
            <h1 className="text-2xl font-medium tracking-tight text-gray-800 md:text-3xl">
              Bem-vindo ao{" "}
              <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text font-semibold text-transparent">
                Painel Criativa
              </span>
            </h1>
            <p className="text-sm leading-relaxed text-gray-600 md:text-base">
              O Painel Criativa é a plataforma de prestação de contas
              operacionais da manutenção das usinas. Acompanhe serviços,
              relatórios e o desempenho com transparência.
            </p>
          </div>
          <SignInButton>
            <Button
              variant="default"
              className="h-10 gap-2 bg-green-500 text-sm text-white hover:bg-green-600"
            >
              <LogInIcon className="h-4 w-4" />
              Fazer login ou criar conta
            </Button>
          </SignInButton>
        </div>
      </div>

      {/* Right Side */}
      <div className="relative hidden h-full md:block">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-gray-50 to-transparent" />
        <Image
          src="/fotoBack.jpg"
          alt="Usina solar da Criativa Energia"
          fill
          className="object-cover"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-white/30" />
      </div>
    </div>
  );
};

export default LoginPage;
