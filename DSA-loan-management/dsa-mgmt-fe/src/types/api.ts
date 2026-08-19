export interface ApiResponse<T = any> {
  success: boolean
  statusCode: number
  message: string
  result: T
}
