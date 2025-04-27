import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import { LogInIcon } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Login - Plataforma de Manutenção Criativa",
  description:
    "Faça login para acessar a Plataforma de Manutenção Criativa Energia.",
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
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background to-background md:hidden" />
        <div className="relative z-10 mx-auto w-full max-w-[500px] space-y-6">
          <div className="space-y-1.5">
            <div className="inline-block p-3 bg-white rounded-md">
              <Image
                src="/logo.svg"
                alt="Google Maps"
                className="w-36 h-full object-contain"
                width={100}
                height={100}
              />
            </div>
            <h1 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl text-nowrap">
              Bem-vindo à{" "}
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-500 bg-clip-text font-bold text-transparent">
                Plataforma de Manutenção
              </span>
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Gerencie a manutenção das usinas solares com eficiência. Acompanhe
              cronogramas de manutenção preventiva e indicadores de desempenho
              em tempo real para garantir a máxima produtividade dos seus
              ativos.
            </p>
          </div>
          <SignInButton>
            <Button variant="default" className="h-10 gap-2 text-sm">
              <LogInIcon className="h-4 w-4" />
              Fazer login ou criar conta
            </Button>
          </SignInButton>
        </div>
      </div>

      {/* Right Side */}
      <div className="relative hidden h-screen md:block">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-background to-transparent" />
        <Image
          src="/fotoBack.jpg"
          alt="Usina solar da Criativa Energia"
          fill
          className="object-cover"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-foreground/5 dark:bg-foreground/10" />
      </div>
    </div>
  );
};

export default LoginPage;
