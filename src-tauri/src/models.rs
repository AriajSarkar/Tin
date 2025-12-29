use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardDto {
    pub id: String,
    pub title: Option<String>,
    pub amount: String,
    pub locked_amount: Option<String>,
    pub archived: bool,
    pub created_at: String,
    pub updated_at: String,
    pub archived_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardWithTodosDto {
    pub id: String,
    pub title: Option<String>,
    pub amount: String,
    pub locked_amount: Option<String>,
    pub archived: bool,
    pub created_at: String,
    pub updated_at: String,
    pub archived_at: Option<String>,
    pub todos: Vec<TodoDto>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodoDto {
    pub id: String,
    pub card_id: String,
    pub title: String,
    pub amount: Option<String>,
    pub done: bool,
    pub scheduled_at: Option<String>,
    pub order_index: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangeLogDto {
    pub id: String,
    pub card_id: String,
    pub kind: String,
    pub payload: serde_json::Value,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResultDto {
    pub card_id: String,
    pub todo_id: Option<String>,
    pub card_title: Option<String>,
    pub todo_title: Option<String>,
    pub snippet: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddTodoResult {
    pub todo: TodoDto,
    pub updated_card: CardDto,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OkResponse {
    pub ok: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchiveResult {
    pub archived_count: i32,
}
