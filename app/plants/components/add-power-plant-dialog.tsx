"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/app/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"

export function AddPowerPlantDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Call the API to create a new power plant
      const response = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          latitude: Number.parseFloat(latitude),
          longitude: Number.parseFloat(longitude),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add power plant")
      }

      const data = await response.json()

      // Close dialog
      setOpen(false)

      // Show success toast
      toast({
        title: "Usina adicionada",
        description: `A usina ${name} foi adicionada com sucesso.`,
        variant: "default",
      })

      // Reset form
      setName("")
      setAddress("")
      setLatitude("")
      setLongitude("")

      // Refresh the page to show the new power plant
      router.refresh()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar a usina.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Nova Usina
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Usina</DialogTitle>
          <DialogDescription>Preencha os dados da nova usina abaixo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Endereço
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="latitude" className="text-right">
                Latitude
              </Label>
              <Input
                id="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="col-span-3"
                type="number"
                step="any"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="longitude" className="text-right">
                Longitude
              </Label>
              <Input
                id="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="col-span-3"
                type="number"
                step="any"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
