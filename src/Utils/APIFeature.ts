class APIFeatures {
       QueryStr: any;
       Query:any;

       constructor(Query:any,QueryStr:any){
           
           this.Query = Query;
           this.QueryStr = QueryStr;
       }
   
       Filtering(){
           //basic filtering
           let QueryObject = {...this.QueryStr};
           const DeleteQuery = ['sort','limit','fields','page']; 
   
           DeleteQuery.forEach(el=> delete QueryObject[el]);
   
           //advanced filtering
           QueryObject = JSON.stringify(QueryObject);
           QueryObject = QueryObject.replace(/\b(gt|gte|lt|lte)\b/g,(match: string) => `$${match}`);
           QueryObject = JSON.parse(QueryObject);
           
           //DB querying
           this.Query = this.Query.find(QueryObject);
   
           return this;
       }
   
       Sorting(){
   
           if(this.QueryStr.sort){
               const SortStr = this.QueryStr.sort.split(",").join(" ");
               this.Query = this.Query.sort(SortStr);
              }
           this.Query = this.Query.sort("-createdAt");
   
           return this;
       }
   
       Fields(){
   
           if(this.QueryStr.fields){
               const SelStr = this.QueryStr.fields.split(",").join(" ");
               this.Query = this.Query.select(SelStr);
              }
           this.Query = this.Query.select("-__v -createdAt -updatedAt");
   
           return this;
       }
   
       Paging(){
   
           const Page = Number(this.QueryStr.page) || 1;
           const Limit = Number(this.QueryStr.limit) || 4;
           const Skip = (Page - 1)* Limit;
   
           this.Query = this.Query.skip(Skip).limit(Limit);
   
           return this;
       }
   
   };
   
export default APIFeatures;