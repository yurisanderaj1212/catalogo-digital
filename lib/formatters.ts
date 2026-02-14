/**
 * Utilidades para formatear horarios y días
 */

/**
 * Convierte hora en formato 24h a formato 12h con AM/PM
 * @param hora - Hora en formato "HH:MM:SS" o "HH:MM"
 * @returns Hora en formato "H:MM AM/PM"
 * @example formatearHora("08:00:00") => "8:00 AM"
 * @example formatearHora("17:30:00") => "5:30 PM"
 */
export function formatearHora(hora: string): string {
  const [hoursStr, minutesStr] = hora.split(':');
  const hours = parseInt(hoursStr);
  const minutes = minutesStr;
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  
  return `${hours12}:${minutes} ${ampm}`;
}

/**
 * Capitaliza la primera letra de un string
 * @param str - String a capitalizar
 * @returns String con primera letra en mayúscula
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Verifica si un array de días es un rango consecutivo
 * @param dias - Array de días de la semana
 * @returns true si los días son consecutivos
 */
export function esRangoConsecutivo(dias: string[]): boolean {
  const todosDias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  
  if (dias.length < 2) return false;
  
  const indices = dias.map(dia => todosDias.indexOf(dia)).sort((a, b) => a - b);
  
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Formatea un array de días a texto legible
 * @param dias - Array de días de la semana
 * @returns String formateado con los días
 * @example formatearDias(['lunes', 'martes', 'miercoles', 'jueves', 'viernes']) => "Lunes a Viernes"
 * @example formatearDias(['lunes', 'miercoles', 'viernes']) => "Lunes, Miércoles, Viernes"
 */
export function formatearDias(dias: string[]): string {
  const todosDias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  
  // Si son todos los días
  if (dias.length === 7) {
    return 'Todos los días';
  }
  
  // Ordenar días según el orden de la semana
  const diasOrdenados = dias.sort((a, b) => {
    return todosDias.indexOf(a) - todosDias.indexOf(b);
  });
  
  // Si son días consecutivos (lunes a viernes)
  if (esRangoConsecutivo(diasOrdenados)) {
    return `${capitalize(diasOrdenados[0])} a ${capitalize(diasOrdenados[diasOrdenados.length - 1])}`;
  }
  
  // Días específicos
  return diasOrdenados.map(capitalize).join(', ');
}
