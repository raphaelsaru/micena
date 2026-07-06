// Server Actions podem rodar antes do cookie de sessão (`app_session`) ser
// sincronizado logo após o login (ver AuthContext.tsx), causando "Não
// autenticado" mesmo com o usuário já logado. Cada tentativa aqui é uma nova
// invocação da Server Action (nova requisição), então já pega o cookie assim
// que ele existir no navegador.
export async function withAuthRetry<T>(fn: () => Promise<T>, attempts = 4, delayMs = 400): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      const isAuthRace = err instanceof Error && err.message === 'Não autenticado'
      if (!isAuthRace || i === attempts - 1) throw err
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  throw new Error('unreachable')
}
