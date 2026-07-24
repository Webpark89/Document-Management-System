export declare class PRItemDto {
    item_name: string;
    quantity: number;
    unit?: string;
    unit_price: number;
    remark?: string;
}
export declare class CreateDocumentDto {
    title: string;
    prefix: string;
    purpose?: string;
    items?: PRItemDto[];
    workflow_steps?: {
        step_order: number;
        approver_id: string;
    }[];
}
