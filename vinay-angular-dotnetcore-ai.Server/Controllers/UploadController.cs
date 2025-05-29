using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace vinay_angular_dotnetcore_ai.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }
        
        [HttpPost]
        public object AnalyseThisImage([FromBody] string value)
        {
            object post = null;


            return post;
        }

        [HttpPost("upload-audio")]
        public async Task<IActionResult> UploadAudio(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var uploadsPath = Path.Combine(_env.WebRootPath, "uploads", "audio");
            Directory.CreateDirectory(uploadsPath); // Ensure the directory exists

            var filePath = Path.Combine(uploadsPath, file.FileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new { message = "Audio uploaded successfully", fileName = file.FileName });
        }

        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var uploadsPath = Path.Combine(_env.WebRootPath, "uploads", "images");
            Directory.CreateDirectory(uploadsPath); // Ensure the directory exists

            var filePath = Path.Combine(uploadsPath, file.FileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new { message = "Image uploaded successfully", fileName = file.FileName });
        }
    }
}
