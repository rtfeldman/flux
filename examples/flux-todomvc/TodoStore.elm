module TodoStore where

import String


type Action
    = Create String
    | Complete TodoId
    | Destroy TodoId
    | DestroyCompleted
    | ToggleCompleteAll
    | UndoComplete TodoId
    | UpdateText TodoId String


type alias TodoId = Int


type alias TodoItem =
    {
       id : TodoId,
       text : String,
       complete : Bool
    }


actions =
    Signal.mergeMany
        [
            Signal.map Create dispatchCreate,
            Signal.map Complete dispatchComplete,
            Signal.map Destroy dispatchDestroy,
            Signal.map (always DestroyCompleted) dispatchDestroyCompleted,
            Signal.map (always ToggleCompleteAll) dispatchToggleCompleteAll,
            Signal.map UndoComplete dispatchUndoComplete,
            Signal.map (\(id, text) -> UpdateText id text) dispatchUpdateText
        ] 


withComplete complete id item =
    if item.id == id then
        { item | complete <- complete }
    else
        item


update action model =
    case action of
        Create untrimmedText ->
            let
                text = 
                    String.trim untrimmedText
            in
                if String.isEmpty text then
                    model
                else
                    { model |
                        todos <- model.todos ++ [TodoItem model.uid text False],
                        uid <- model.uid + 1
                    }

        Destroy id ->
            let
                todosWithoutId =
                    List.filter (\item -> item.id /= id) model.todos
            in
                { model | todos <- todosWithoutId }

        DestroyCompleted ->
            { model | todos <- List.filter (\item -> not item.complete) model.todos}

        Complete id ->
            { model | todos <- List.map (withComplete True id) model.todos }

        UndoComplete id ->
            { model | todos <- List.map (withComplete False id) model.todos }

        UpdateText id text ->
            let
                withUpdatedText item =
                    if item.id == id then
                        { item | text <- text }
                    else
                        item
            in
                { model | todos <- List.map withUpdatedText model.todos }

        ToggleCompleteAll ->
            let
                isComplete item =
                    item.complete

                allComplete =
                    List.all isComplete model.todos

                withToggledComplete item =
                    { item | complete <- not allComplete }
                
                toggledTodos =
                    List.map withToggledComplete model.todos
            in
                { model | todos <- toggledTodos }

        _ ->
            model


initialModel =
    {
        todos = [],
        uid = 1
    }


modelChanges =
    Signal.foldp update initialModel actions


port todoListChanges : Signal (List TodoItem)
port todoListChanges = Signal.dropRepeats (Signal.map .todos modelChanges)

port dispatchCreate : Signal String
port dispatchComplete : Signal TodoId
port dispatchDestroy : Signal TodoId
port dispatchDestroyCompleted : Signal ()
port dispatchToggleCompleteAll : Signal ()
port dispatchUndoComplete : Signal TodoId
port dispatchUpdateText : Signal (TodoId, String)