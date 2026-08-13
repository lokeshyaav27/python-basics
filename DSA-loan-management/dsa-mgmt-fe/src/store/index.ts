import { configureStore, createSlice } from '@reduxjs/toolkit'

const sampleSlice = createSlice({
  name: 'sample',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1 }
  }
})

export const { increment } = sampleSlice.actions

export const store = configureStore({
  reducer: {
    sample: sampleSlice.reducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
