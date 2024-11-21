export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string;
          title: string;
          description: string;
          cuisine_type: string;
          difficulty: string;
          servings: number;
          prep_time: number;
          cook_time: number;
          total_time: number;
          ingredients: any[];
          steps: any[];
          macros: {
            calories: number;
            protein_g: number;
            carbs_g: number;
            fat_g: number;
            fiber_g: number;
            sugar_g: number;
            saturated_fat_g: number;
            protein_percentage: number;
            carbs_percentage: number;
            fat_percentage: number;
          };
          equipment_needed: string[];
          tags: string[];
          tips_and_tricks: string[];
          storage_instructions: string;
          reheating_instructions: string;
          variations: string[];
          calories_per_serving: number;
          cost_estimate: number;
          shopping_list: any[];
          source_url: string | null;
          video_transcription: string | null;
          thumbnail_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          cuisine_type: string;
          difficulty: string;
          servings: number;
          prep_time: number;
          cook_time: number;
          total_time: number;
          ingredients: any[];
          steps: any[];
          macros: {
            calories: number;
            protein_g: number;
            carbs_g: number;
            fat_g: number;
            fiber_g: number;
            sugar_g: number;
            saturated_fat_g: number;
            protein_percentage: number;
            carbs_percentage: number;
            fat_percentage: number;
          };
          equipment_needed: string[];
          tags: string[];
          tips_and_tricks: string[];
          storage_instructions: string;
          reheating_instructions: string;
          variations: string[];
          calories_per_serving: number;
          cost_estimate: number;
          shopping_list: any[];
          source_url?: string | null;
          video_transcription?: string | null;
          thumbnail_url?: string | null;
          created_at?: string;
        };
        Update: {
          [key: string]: any;
        };
      };
    };
    Functions: {
      [key: string]: any;
    };
  };
}