export function getLocalStorage(key: string) {
  return localStorage.getItem(key)
}

export function setLocalStorage(key: string, value: string) {
  localStorage.setItem(key, value)
}

export function removeLocalStorage(key: string) {
  localStorage.removeItem(key)
}

export function clearLocalStorage() {
  localStorage.clear()
}

export function getLocalStorageObject<T>(key: string): T | null {
  const value = getLocalStorage(key)
  return value ? JSON.parse(value) : null
}

export function setLocalStorageObject(key: string, value: unknown) {
  setLocalStorage(key, JSON.stringify(value))
}
