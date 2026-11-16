"use strict";(()=>{var e={};e.id=792,e.ids=[792],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},5900:e=>{e.exports=require("pg")},9878:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>h,patchFetch:()=>E,requestAsyncStorage:()=>c,routeModule:()=>d,serverHooks:()=>l,staticGenerationAsyncStorage:()=>m});var r={};a.r(r),a.d(r,{POST:()=>u});var n=a(9303),o=a(8716),s=a(670),i=a(7070);let p=new(a(5900)).Pool({connectionString:process.env.DATABASE_URL});async function u(e){let t=await p.connect();try{let{order_id:a,partner_id:r,payment_type:n,amount:o,payment_method:s,reference_code:p,notes:u}=await e.json();if(!a||!r||!n||!o||0>=Number(o))return i.NextResponse.json({error:"Thiếu dữ liệu bắt buộc hoặc số tiền kh\xf4ng hợp lệ"},{status:400});await t.query("BEGIN");let d=`
      INSERT INTO payments (order_id, partner_id, payment_type, amount, payment_method, reference_code, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, payment_date;
    `,c=[a,r,n,o,s,p,u];await t.query(d,c);let m=`
      UPDATE orders
      SET 
        paid_amount = COALESCE(paid_amount, 0) + $1,
        payment_status = CASE
          WHEN COALESCE(paid_amount, 0) + $1 >= total_amount THEN 'PAID'
          WHEN COALESCE(paid_amount, 0) + $1 > 0 THEN 'PARTIAL'
          ELSE 'UNPAID'
        END
      WHERE id = $2
      RETURNING total_amount, paid_amount, payment_status;
    `,l=(await t.query(m,[o,a])).rows[0];return await t.query("COMMIT"),i.NextResponse.json({success:!0,message:"Ghi nhận thanh to\xe1n th\xe0nh c\xf4ng",order:l},{status:200})}catch(e){return await t.query("ROLLBACK"),console.error("Lỗi khi ghi nhận thanh to\xe1n:",e),i.NextResponse.json({error:"Lỗi server khi xử l\xfd thanh to\xe1n"},{status:500})}finally{t.release()}}let d=new n.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/payments/create/route",pathname:"/api/payments/create",filename:"route",bundlePath:"app/api/payments/create/route"},resolvedPagePath:"E:\\my-erp-system-boilerplate\\app\\api\\payments\\create\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:c,staticGenerationAsyncStorage:m,serverHooks:l}=d,h="/api/payments/create/route";function E(){return(0,s.patchFetch)({serverHooks:l,staticGenerationAsyncStorage:m})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[948,972],()=>a(9878));module.exports=r})();