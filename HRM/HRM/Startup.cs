using System;
using HRM.Helpers;
using HRM.Repositories.User;
using HRM.Services.MongoDB;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace HRM
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers();
            services.Configure<MongoDbSetting>(options =>
            {
                options.ConnectionString = Configuration.GetSection("MongoDb:ConnectionString").Value;
                options.Database = Configuration.GetSection("MongoDb:Database").Value;
                options.UserName = Configuration.GetSection("MongoDb:UserName").Value;
                options.Host = Configuration.GetSection("MongoDb:Host").Value;
                options.Port = Int32.Parse(Configuration.GetSection("MongoDb:Port").Value);
                options.Password = Configuration.GetSection("MongoDb:Password").Value;
                options.AuthMechanism = Configuration.GetSection("MongoDb:AuthMechanism").Value;
            });

            services.AddSingleton<IMongoDbSetting>(sp =>
                sp.GetRequiredService<IOptions<MongoDbSetting>>().Value);

            services.AddSingleton<MongoDbService>();

            services.AddSingleton<IUserRepository, UserRepositoryImpl>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseHttpsRedirection();

            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
