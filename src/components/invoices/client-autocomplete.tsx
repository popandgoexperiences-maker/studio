'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Client } from '@/lib/definitions';

interface ClientAutocompleteProps {
  clients: Client[];
  value: string;
  onClientSelect: (client: Client) => void;
  onValueChange: (value: string) => void;
}

export function ClientAutocomplete({
  clients,
  value,
  onClientSelect,
  onValueChange
}: ClientAutocompleteProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (currentValue: string) => {
    const client = clients.find(
      (c) => c.name.toLowerCase() === currentValue.toLowerCase()
    );
    if (client) {
      onClientSelect(client);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
        <Label htmlFor="clientName">Nombre o Razón Social</Label>
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                 <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between mt-2 font-normal"
                >
                    {value
                        ? clients.find((client) => client.name.toLowerCase() === value.toLowerCase())?.name
                        : "Selecciona o escribe un cliente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command shouldFilter={false}>
                    <CommandInput 
                        placeholder="Buscar cliente..." 
                        value={value}
                        onValueChange={onValueChange}
                    />
                    <CommandList>
                        <CommandEmpty>No se encontró el cliente. Rellena los datos para crearlo.</CommandEmpty>
                        <CommandGroup>
                        {clients
                            .filter(c => c.name.toLowerCase().includes(value.toLowerCase()))
                            .map((client) => (
                            <CommandItem
                                key={client.id}
                                value={client.name}
                                onSelect={handleSelect}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value.toLowerCase() === client.name.toLowerCase() ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {client.name}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    </div>
  );
}

// Add Label component here if it's not globally available in your setup.
// For this example, assuming it's imported from 'components/ui/label'.
import { cva, type VariantProps } from "class-variance-authority"
import * as LabelPrimitive from "@radix-ui/react-label"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName
