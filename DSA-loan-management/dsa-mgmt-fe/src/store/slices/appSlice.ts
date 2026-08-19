import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import i18n from '../../i18n'

export interface AppState {
  language: 'en' | 'hi'
}

const initialState: AppState = {
  language: 'en',
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<'en' | 'hi'>) => {
      state.language = action.payload
      if (i18n.language !== action.payload) {
        i18n.changeLanguage(action.payload)
      }
    },
  },
})

export const { setLanguage } = appSlice.actions

export default appSlice.reducer
