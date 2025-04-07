import { createAppSlice } from "@/common/utils"
import { todolistsApi } from "@/features/todolists/api/todolistsApi"
import type { Todolist } from "@/features/todolists/api/todolistsApi.types"
import { setStatus } from "@/app/app-slice.ts"

export const todolistsSlice = createAppSlice({
  name: "todolists",
  initialState: [] as DomainTodolist[],
  selectors: {
    selectTodolists: (state) => state
  },
  reducers: (create) => ({
    //actions
    changeTodolistFilterAC: create.reducer<{ id: string; filter: FilterValues }>((state, action) => {
      const todolist = state.find((todolist) => todolist.id === action.payload.id)
      if (todolist) {
        todolist.filter = action.payload.filter
      }
    }),
    //async actions (thunk)
    fetchTodolists: create.asyncThunk(async (_arg, { dispatch, rejectWithValue }) => {
      try {
        dispatch(setStatus({ status: "loading" }))
        //искусственная задержка 2 секунды
        await new Promise(resolve => setTimeout(resolve, 2000))

        const res = await todolistsApi.getTodolists()
        dispatch(setStatus({ status: "succeeded" }))
        return { todolists: res.data }
      } catch (error) {
        return rejectWithValue(null)
      }
    }, {
      fulfilled: (state, action) => {
        action.payload?.todolists.forEach((tl) => {
            state.push({ ...tl, filter: "all" })
          }
        )
      }
    }),
    createTodolist: create.asyncThunk(async (arg: string, { rejectWithValue }) => {
      try {
        const res = await todolistsApi.createTodolist(arg)
        return { todolist: res.data.data.item }
      } catch (error) {
        return rejectWithValue(null)
      }
    }, {
      fulfilled: (state, action) => {
        state.unshift({ ...action.payload.todolist, filter: "all" })
      }
    }),
    deleteTodolist: create.asyncThunk(async (id: string, { rejectWithValue }) => {
      try {
        await todolistsApi.deleteTodolist(id)
        return {id}
      } catch (error) {
        return rejectWithValue(null)
      }
    }, {
      fulfilled: (state, action) => {
        const index = state.findIndex((todolist) => todolist.id === action.payload.id)
        if (index !== -1) {
          state.splice(index, 1)
        }
      }
    }),
    changeTodolistTitle: create.asyncThunk(async (args: {id: string, title: string }, { rejectWithValue }) => {
      try {
        await todolistsApi.changeTodolistTitle(args)
        return args
      } catch (error) {
        return rejectWithValue(null)
      }
    }, {fulfilled: (state, action) => {
        const index = state.findIndex((todolist) => todolist.id === action.payload.id)
        if (index !== -1) {
          state[index].title = action.payload.title
        }
      }})
  })
})

export const { selectTodolists } = todolistsSlice.selectors
export const { changeTodolistFilterAC, fetchTodolists, createTodolist, deleteTodolist, changeTodolistTitle } = todolistsSlice.actions
export const todolistsReducer = todolistsSlice.reducer

export type DomainTodolist = Todolist & {
  filter: FilterValues
}

export type FilterValues = "all" | "active" | "completed"
