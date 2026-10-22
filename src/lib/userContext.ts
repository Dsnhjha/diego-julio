let _userId: string | null = null

export function setUserId(id: string | null) {
  _userId = id
}

export function getUserId(): string {
  if (!_userId) throw new Error('Usuário não autenticado')
  return _userId
}

export function getUserIdOrNull(): string | null {
  return _userId
}
