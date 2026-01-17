import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Esta función se llamará para comprobar el tamaño de la pantalla.
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Ejecuta la función en el montaje inicial del lado del cliente para establecer el estado correcto.
    handleResize();

    // Añade el detector de eventos para futuros cambios de tamaño.
    window.addEventListener("resize", handleResize);

    // Limpia el detector de eventos cuando el componente se desmonta.
    return () => window.removeEventListener("resize", handleResize);
  }, []); // El array de dependencias vacío asegura que este efecto se ejecute solo una vez en el montaje.

  return isMobile;
}
