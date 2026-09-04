export interface Source {
  title: string;
  url: string;
}

export interface AskRequest {
  query: string;
}

export interface AskResponse {
  answer: string;
  sources: Source[];
}
