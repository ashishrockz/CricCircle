export interface Adapter<T> {
  adapt(data: any): T;
}

export interface ListAdapter<T> {
  adaptList(data: any[]): T[];
}
