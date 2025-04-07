import { createTodolist, deleteTodolist } from "./todolists-slice"
import { createAppSlice } from "@/common/utils"
import { tasksApi } from "@/features/todolists/api/tasksApi.ts"
import { CreateTaskArgs, DeleteTaskArgs, DomainTask, UpdateTaskModel } from "@/features/todolists/api/tasksApi.types.ts"
import { setStatus } from "@/app/app-slice.ts"
import { RootState } from "@/app/store.ts"

export const tasksSlice = createAppSlice({
  name: "tasks",
  initialState: {} as TasksState,
  selectors: {
    selectTasks: (state) => state
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTodolist.fulfilled, (state, action) => {
        state[action.payload.todolist.id] = []
      })
      .addCase(deleteTodolist.fulfilled, (state, action) => {
        delete state[action.payload.id]
      })
  },
  reducers: (create) => ({
    fetchTasks: create.asyncThunk(
      async (todolistId: string, { dispatch, rejectWithValue }) => {
        try {
          dispatch(setStatus({ status: "loading" }))
          const res = await tasksApi.getTasks(todolistId)
          dispatch(setStatus({ status: "succeeded" }))
          return { todolistId, tasks: res.data.items }
        } catch (error) {
          dispatch(setStatus({ status: "failed" }))
          return rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          state[action.payload.todolistId] = action.payload.tasks
        },
      },
    ),

    createTask: create.asyncThunk(async (args: CreateTaskArgs, { dispatch, rejectWithValue }) => {
      try {
        dispatch(setStatus({status: 'loading'}))
        //искусственная задержка 2 секунды
        await new Promise(resolve => setTimeout(resolve, 2000))

        const res = await tasksApi.createTask(args)
        // dispatch(setStatus({status: 'succeeded'}))
        return { task: res.data.data.item }
      } catch (error) {
        // dispatch(setStatus({status: 'failed'}))
        return rejectWithValue(null)
      } finally {
        dispatch(setStatus({status: 'idle'}))
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
    // changeTaskStatus: create.asyncThunk(async (task: DomainTask, { dispatch, rejectWithValue }) => {
    //   try {
    //     dispatch(setStatus({status: 'loading'}))
    //     //искусственная задержка 2 секунды
    //     await new Promise(resolve => setTimeout(resolve, 2000))
    //
    //     const model: UpdateTaskModel = {
    //       status: task.status,
    //       title: task.title,
    //       priority: task.priority,
    //       deadline: task.deadline,
    //       description: task.description,
    //       startDate: task.startDate
    //     }
    //     await tasksApi.updateTask({ taskId: task.id, todolistId: task.todoListId, model })
    //     return task
    //   } catch (error) {
    //     return rejectWithValue(null)
    //   } finally {
    //     dispatch(setStatus({status: 'idle'}))
    //   }
    // }, {
    //   fulfilled: (state, action) => {
    //     const task = state[action.payload.todoListId].find((task) => task.id === action.payload.id)
    //     if (task) {
    //       task.status = action.payload.status
    //     }
    //   }
    // }),
    // changeTaskTitle: create.asyncThunk (async (task: DomainTask, { rejectWithValue }) => {
    //   try {
    //
    //     const model: UpdateTaskModel = {
    //       status: task.status,
    //       title: task.title,
    //       priority: task.priority,
    //       deadline: task.deadline,
    //       description: task.description,
    //       startDate: task.startDate
    //     }
    //     await tasksApi.updateTask({ taskId: task.id, todolistId: task.todoListId, model })
    //     return task
    //   } catch (error) {
    //     return rejectWithValue(null)
    //   }
    // }, {
    //   fulfilled: (state, action) => {
    //     const task = state[action.payload.todoListId].find((task) => task.id === action.payload.id)
    //     if (task) {
    //       task.title = action.payload.title
    //     }
    //   }
    // }),


    // универсальная санка для обновления таски
    updateTask: create.asyncThunk (async (payload: {todolistId: string; taskId: string; domainModel: Partial<UpdateTaskModel>}, {dispatch, getState, rejectWithValue }
    ) => {
      const { todolistId, taskId, domainModel } = payload
      const allTodolistTasks = (getState() as RootState).tasks[todolistId]
      const task = allTodolistTasks.find((task) => task.id === taskId)

      if (!task) {
        return rejectWithValue(null)
      }

      const model: UpdateTaskModel = {
        description: task.description,
        title: task.title,
        priority: task.priority,
        startDate: task.startDate,
        deadline: task.deadline,
        status: task.status,
        ...domainModel,
      }


      try {
        dispatch(setStatus({ status: "loading" }))
        const res = await tasksApi.updateTask({ todolistId, taskId, model })
        dispatch(setStatus({ status: "succeeded" }))
        return { task: res.data.data.item }

      } catch (error) {
        dispatch(setStatus({ status: "failed" }))
        return rejectWithValue(null)
      }
    }, {
      fulfilled: (state, action) => {
        const allTodolistTasks = state[action.payload.task.todoListId]
        const taskIndex = allTodolistTasks.findIndex((task) => task.id === action.payload.task.id)
        if (taskIndex !== -1) {
          allTodolistTasks[taskIndex] = action.payload.task
        }
      }
    })
  })
})

export const { selectTasks } = tasksSlice.selectors
export const { fetchTasks, createTask, deleteTask, updateTask } = tasksSlice.actions
export const tasksReducer = tasksSlice.reducer

export type TasksState = Record<string, DomainTask[]>



