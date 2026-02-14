/**
 * Utilidades para validar datos de horarios y grupos de WhatsApp
 */

/**
 * Valida que un enlace de WhatsApp tenga el formato correcto
 * @param url - URL a validar
 * @returns true si el enlace es válido
 * @example validarEnlaceWhatsApp("https://chat.whatsapp.com/ABC123xyz") => true
 * @example validarEnlaceWhatsApp("https://wa.me/123456789") => false
 */
export function validarEnlaceWhatsApp(url: string): boolean {
  if (!url || url.trim() === '') return false;
  
  const regex = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/;
  return regex.test(url);
}

/**
 * Valida que la hora de apertura sea anterior a la hora de cierre
 * @param apertura - Hora de apertura en formato "HH:MM:SS" o "HH:MM"
 * @param cierre - Hora de cierre en formato "HH:MM:SS" o "HH:MM"
 * @returns true si apertura < cierre
 */
export function validarHorarios(apertura: string, cierre: string): boolean {
  if (!apertura || !cierre) return false;
  
  const [aHours, aMinutes] = apertura.split(':').map(Number);
  const [cHours, cMinutes] = cierre.split(':').map(Number);
  
  const aperturaMinutos = aHours * 60 + aMinutes;
  const cierreMinutos = cHours * 60 + cMinutes;
  
  return aperturaMinutos < cierreMinutos;
}

/**
 * Valida que el nombre de un grupo no esté vacío
 * @param nombre - Nombre del grupo
 * @returns true si el nombre es válido
 */
export function validarNombreGrupo(nombre: string): boolean {
  return Boolean(nombre && nombre.trim().length > 0);
}

/**
 * Valida que haya al menos un día laboral seleccionado
 * @param dias - Array de días laborales
 * @returns true si hay al menos un día
 */
export function validarDiasLaborales(dias: string[]): boolean {
  return Boolean(dias && dias.length > 0);
}
