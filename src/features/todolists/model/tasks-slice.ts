import { createTodolistTC, deleteTodolistTC } from "./todolists-slice"
import { createAppSlice } from "@/common/utils"
import { tasksApi } from "@/features/todolists/api/tasksApi.ts"
import { CreateTaskArgs, DeleteTaskArgs, DomainTask, UpdateTaskModel } from "@/features/todolists/api/tasksApi.types.ts"
import { setStatus } from "@/app/app-slice.ts"

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
        return { tasks: res.data.items, todolistId }
      } catch (error) {
        return rejectWithValue(null)
      }
    }, {
      fulfilled: (state, action) => {
        state[action.payload.todolistId] = action.payload.tasks
      }
    }),
    createTask: create.asyncThunk(async (args: CreateTaskArgs, { dispatch, rejectWithValue }) => {
      try {
        dispatch(setStatus({status: 'loading'}))
        //искусственная задержка 2 секунды
        await new Promise(resolve => setTimeout(resolve, 2000))

        const res = await tasksApi.createTask(args)
        dispatch(setStatus({status: 'succeeded'}))
        return { task: res.data.data.item }
      } catch (error) {
        dispatch(setStatus({status: 'failed'}))
        return rejectWithValue(null)
      }
    }, {
      fulfilled: (state, action) => {
        state[action.payload.task.todoListId].unshift(action.payload.task)
      }
    }),
    deleteTask: create.asyncThunk(async (args: DeleteTaskArgs, { rejectWithValue }) => {
      try {
        await tasksApi.deleteTask(args)
        return args
      } catch (error) {
        return rejectWithValue(null)
      }
    }, {
      fulfilled: (state, action) => {
        const tasks = state[action.payload.todolistId]
        const index = tasks.findIndex((task) => task.id === action.payload.taskId)
        if (index !== -1) {
          tasks.splice(index, 1)
        }
      }
    }),
    //1 ариант
    // changeTaskStatus: create.asyncThunk(async (args: {
    //   todolistId: string;
    //   taskId: string;
    //   status: TaskStatus
    // }, { rejectWithValue, getState }) => {
    //   const { todolistId, taskId, status } = args
    //
    //   try {
    //     const state = getState() as RootState
    //     const tasks = state.tasks
    //     const tasksForTodolist = tasks[todolistId]
    //     const currentTask = tasksForTodolist.find((task) => task.id === taskId)
    //     if (currentTask) {
    //       const model: UpdateTaskModel = {
    //         status,
    //         title: currentTask.title,
    //         priority: currentTask.priority,
    //         deadline: currentTask.deadline,
    //         description: currentTask.description,
    //         startDate: currentTask.startDate
    //       }
    //       await tasksApi.updateTask({ taskId, todolistId, model })
    //       return args
    //     } else {
    //       return rejectWithValue(null)
    //     }
    //   } catch (error) {
    //     return rejectWithValue(null)
    //   }
    // }, {
    //   fulfilled: (state, action) => {
    //     const task = state[action.payload.todolistId].find((task) => task.id === action.payload.taskId)
    //     if (task) {
    //       task.status = action.payload.status
    //     }
    //   }
    // })

    //2 ариант
    changeTaskStatus: create.asyncThunk(async (task: DomainTask, { rejectWithValue }) => {
      try {
        const model: UpdateTaskModel = {
          status: task.status,
          title: task.title,
          priority: task.priority,
          deadline: task.deadline,
          description: task.description,
          startDate: task.startDate
        }
        await tasksApi.updateTask({ taskId: task.id, todolistId: task.todoListId, model })
        return task
      } catch (error) {
        return rejectWithValue(null)
      }
    }, {
      fulfilled: (state, action) => {
        const task = state[action.payload.todoListId].find((task) => task.id === action.payload.id)
        if (task) {
          task.status = action.payload.status
        }
      }
    })
  })
})

export const { selectTasks } = tasksSlice.selectors
export const { changeTaskStatus, changeTaskTitleAC, fetchTasks, createTask, deleteTask } = tasksSlice.actions
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
