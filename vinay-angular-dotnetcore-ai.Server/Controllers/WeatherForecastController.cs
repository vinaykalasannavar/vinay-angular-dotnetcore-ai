using Microsoft.AspNetCore.Mvc;

namespace vinay_angular_dotnetcore_ai.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WeatherForecastController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        private static readonly string[] Summaries = new[]
        {
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        };

        private readonly ILogger<WeatherForecastController> _logger;

        public WeatherForecastController(ILogger<WeatherForecastController> logger, IWebHostEnvironment env)
        {
            _logger = logger;
            _env = env;
        }

        [HttpGet(Name = "GetWeatherForecast")]
        public IEnumerable<WeatherForecast> Get()
        {
            return Enumerable.Range(1, 5).Select(index => new WeatherForecast
            {
                Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                TemperatureC = Random.Shared.Next(-20, 55),
                Summary = Summaries[Random.Shared.Next(Summaries.Length)]
            })
            .ToArray();
        }

        [HttpPost]
        public object AnalyseThisImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var folderName = GetFolderName(file);
            var uploadsPath = Path.Combine(_env.ContentRootPath, "uploads", folderName);
            Directory.CreateDirectory(uploadsPath); // Ensure the directory exists

            var fileNameOnly = Path.GetFileNameWithoutExtension(file.FileName);
            var extension = Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsPath, $"{fileNameOnly}_{DateTime.Now:yyyyMMdd_hhmmss}.{extension}");

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                file.CopyTo(stream);
            }

            return Ok(new { message = "Audio uploaded successfully", fileName = file.FileName });
        }

        private static string GetFolderName(IFormFile file)
        {
            string folderName;
            if (((FormFile)file).ContentType.Contains("image", StringComparison.OrdinalIgnoreCase))
                folderName = "images";
            else
                folderName = "audio";
            return folderName;
        }
    }
}
