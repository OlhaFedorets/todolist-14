import { createTodolistTC, deleteTodolistTC } from "./todolists-slice"
import { createAppSlice } from "@/common/utils"
import { tasksApi } from "@/features/todolists/api/tasksApi.ts"
import { CreateTaskArgs, DeleteTaskArgs, DomainTask } from "@/features/todolists/api/tasksApi.types.ts"
import { TaskStatus } from "@/common/enums"

export const tasksSlice = createAppSlice({
  name: "tasks",
  initialState: {} as TasksState,
  selectors: {
    selectTasks: (state) => state
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTodolistTC.fulfilled, (state, action) => {
        state[action.payload.todolist.id] = []
      })
      .addCase(deleteTodolistTC.fulfilled, (state, action) => {
        delete state[action.payload.id]
      })
  },
  reducers: (create) => ({
    //actions

    changeTaskStatusAC: create.reducer<{ todolistId: string; taskId: string; isDone: boolean }>((state, action) => {
      const task = state[action.payload.todolistId].find((task) => task.id === action.payload.taskId)
      if (task) {
        task.status = action.payload.isDone ? TaskStatus.Completed : TaskStatus.New
      }
    }),
    changeTaskTitleAC: create.reducer<{ todolistId: string; taskId: string; title: string }>((state, action) => {
      const task = state[action.payload.todolistId].find((task) => task.id === action.payload.taskId)
      if (task) {
        task.title = action.payload.title
      }
    }),
    //thunk
    fetchTasks: create.asyncThunk(async (todolistId: string, { rejectWithValue }) => {
      try {
        const res = await tasksApi.getTasks(todolistId)
        return {tasks: res.data.items, todolistId}
      } catch (error) {
        return rejectWithValue(null)
      }
    }, {
      fulfilled: (state, action) => {
        state[action.payload.todolistId] = action.payload.tasks
      }
    }),
    createTask: create.asyncThunk(async ( args: CreateTaskArgs,{ rejectWithValue }) => {
      try {
        const res = await tasksApi.createTask(args)
        return {task: res.data.data.item}
      } catch (error) {
        return rejectWithValue(null)
      }
    }, {
      fulfilled: (state, action)=>{
        state[action.payload.task.todoListId].unshift(action.payload.task)
      }
    }),
    deleteTask: create.asyncThunk(async (args: DeleteTaskArgs, { rejectWithValue })=>{
      try {
        await tasksApi.deleteTask(args)
        return args
      } catch (error) {
        return rejectWithValue(null)
      }
    }, {fulfilled: (state, action)=>{
        const tasks = state[action.payload.todolistId]
        const index = tasks.findIndex((task) => task.id === action.payload.taskId)
        if (index !== -1) {
          tasks.splice(index, 1)
        }
      }})
  })
})

export const { selectTasks } = tasksSlice.selectors
export const { changeTaskStatusAC, changeTaskTitleAC, fetchTasks, createTask, deleteTask } = tasksSlice.actions
export const tasksReducer = tasksSlice.reducer


export type TasksState = Record<string, DomainTask[]>


// import { createSlice, nanoid } from "@reduxjs/toolkit"
// import { createTodolistTC, deleteTodolistTC } from "./todolists-slice"
//
// export const tasksSlice = createSlice({
//   name: "tasks",
//   initialState: {} as TasksState,
//   selectors: {
//     selectTasks: (state) => state,
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(createTodolistTC.fulfilled, (state, action) => {
//         state[action.payload.todolist.id] = []
//       })
//       .addCase(deleteTodolistTC.fulfilled, (state, action) => {
//         delete state[action.payload.id]
//       })
//   },
//   reducers: (create) => ({
//     deleteTaskAC: create.reducer<{ todolistId: string; taskId: string }>((state, action) => {
//       const tasks = state[action.payload.todolistId]
//       const index = tasks.findIndex((task) => task.id === action.payload.taskId)
//       if (index !== -1) {
//         tasks.splice(index, 1)
//       }
//     }),
//     createTaskAC: create.reducer<{ todolistId: string; title: string }>((state, action) => {
//       const newTask: Task = { title: action.payload.title, isDone: false, id: nanoid() }
//       state[action.payload.todolistId].unshift(newTask)
//     }),
//     changeTaskStatusAC: create.reducer<{ todolistId: string; taskId: string; isDone: boolean }>((state, action) => {
//       const task = state[action.payload.todolistId].find((task) => task.id === action.payload.taskId)
//       if (task) {
//         task.isDone = action.payload.isDone
//       }
//     }),
//     changeTaskTitleAC: create.reducer<{ todolistId: string; taskId: string; title: string }>((state, action) => {
//       const task = state[action.payload.todolistId].find((task) => task.id === action.payload.taskId)
//       if (task) {
//         task.title = action.payload.title
//       }
//     }),
//   }),
// })
//
// export const { selectTasks } = tasksSlice.selectors
// export const { deleteTaskAC, createTaskAC, changeTaskStatusAC, changeTaskTitleAC } = tasksSlice.actions
// export const tasksReducer = tasksSlice.reducer
//
// export type Task = {
//   id: string
//   title: string
//   isDone: boolean
// }
//
// export type TasksState = Record<string, DomainTask>
